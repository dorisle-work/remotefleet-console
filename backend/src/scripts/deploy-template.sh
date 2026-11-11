#!/usr/bin/env bash
# scripts/deploy-template.sh
set -Eeuo pipefail

# Các tham số được truyền tự động từ Deployer Core
APP_DIR="${1:-/var/www/app}"
TARGET_BRANCH="${2:-main}"
DB_NAME="${3:-production_db}"
DEPLOYMENT_ID="${4:-auto_deploy}"

BACKUP_DIR="/var/backups/remotefleet"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SNAPSHOT_FILE="${BACKUP_DIR}/db_${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
cd "$APP_DIR"

PREVIOUS_COMMIT=$(git rev-parse HEAD || echo "NONE")
echo "[SYS] Mốc commit ổn định trước cập nhật: ${PREVIOUS_COMMIT}"
echo "[SYS] Deployment ID: ${DEPLOYMENT_ID}"

# Bẫy lỗi: Kích hoạt khôi phục tự động nếu có bất kỳ lệnh nào thất bại
cleanup_and_rollback() {
    local exit_code=$?
    echo -e "\n\033[31;1m[ROLLBACK ALERT] Phát hiện lỗi ở bước trên (Exit code: ${exit_code}). Bắt đầu khôi phục...\033[0m" >&2

    # 1. Khôi phục mã nguồn về commit cũ
    if [ "$PREVIOUS_COMMIT" != "NONE" ]; then
        echo "[ROLLBACK] Đang checkout lại commit cũ: ${PREVIOUS_COMMIT}..."
        git checkout -f "$PREVIOUS_COMMIT"
    fi

    # 2. Khôi phục cơ sở dữ liệu từ snapshot nếu đã tạo
    if [ -f "$SNAPSHOT_FILE" ]; then
        echo "[ROLLBACK] Đang phục hồi cơ sở dữ liệu từ snapshot: ${SNAPSHOT_FILE}..."
        zcat "$SNAPSHOT_FILE" | mysql "$DB_NAME" || true
    fi

    echo -e "\033[33;1m[ROLLBACK COMPLETE] Hệ thống đã trở về trạng thái an toàn trước triển khai.\033[0m" >&2
    exit "$exit_code"
}

trap cleanup_and_rollback ERR

echo "=== [BƯỚC 1/5] TẠO SNAPSHOT CƠ SỞ DỮ LIỆU ==="
mysqldump --single-transaction --quick "$DB_NAME" | gzip > "$SNAPSHOT_FILE"
echo "Đã tạo bản lưu trữ DB: ${SNAPSHOT_FILE}"

echo "=== [BƯỚC 2/5] ĐỒNG BỘ MÃ NGUỒN TỪ REPOSITORY ==="
git fetch origin "$TARGET_BRANCH"
git checkout "$TARGET_BRANCH"
git pull origin "$TARGET_BRANCH"
NEW_COMMIT=$(git rev-parse HEAD)
echo "Đã cập nhật lên commit mới: ${NEW_COMMIT}"

echo "=== [BƯỚC 3/5] CẬP NHẬT DEPENDENCIES ==="
if [ -f "composer.json" ]; then
    composer install --no-dev --optimize-autoloader --no-interaction
fi
if [ -f "package.json" ]; then
    npm ci --omit=dev
fi

echo "=== [BƯỚC 4/5] DI TRÚ CƠ SỞ DỮ LIỆU (DATABASE MIGRATIONS) ==="
if [ -f "artisan" ]; then
    php artisan migrate --force
fi

echo "=== [BƯỚC 5/5] TẢI LẠI TIẾN TRÌNH & DỊCH VỤ ==="
if [ -f "artisan" ]; then
    php artisan queue:restart || true
fi
systemctl reload nginx php8.2-fpm || true

echo -e "\n\033[32;1m[SUCCESS] Triển khai thành công commit ${NEW_COMMIT} trên máy chủ!\033[0m"
