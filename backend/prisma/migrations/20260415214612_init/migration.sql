-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'analyst') NOT NULL DEFAULT 'analyst',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `external_id` VARCHAR(120) NULL,
    `name` VARCHAR(160) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `country` VARCHAR(80) NOT NULL,
    `lifecycle_stage` VARCHAR(80) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `customers_external_id_key`(`external_id`),
    INDEX `customers_email_idx`(`email`),
    INDEX `customers_country_idx`(`country`),
    INDEX `customers_lifecycle_stage_idx`(`lifecycle_stage`),
    INDEX `idx_customer_country_stage`(`country`, `lifecycle_stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` VARCHAR(40) NOT NULL,
    `ordered_at` DATETIME(3) NOT NULL,

    INDEX `orders_customer_id_idx`(`customer_id`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_ordered_at_idx`(`ordered_at`),
    INDEX `idx_order_customer_time`(`customer_id`, `ordered_at`),
    INDEX `idx_order_status_time`(`status`, `ordered_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `event_type` VARCHAR(120) NOT NULL,
    `occurred_at` DATETIME(3) NOT NULL,
    `metadata` JSON NULL,

    INDEX `events_customer_id_idx`(`customer_id`),
    INDEX `events_event_type_idx`(`event_type`),
    INDEX `events_occurred_at_idx`(`occurred_at`),
    INDEX `idx_event_type_time`(`event_type`, `occurred_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
