/*
  Warnings:

  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invites` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `saved_segments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_actor_id_fkey`;

-- DropForeignKey
ALTER TABLE `invites` DROP FOREIGN KEY `invites_invited_by_fkey`;

-- DropForeignKey
ALTER TABLE `saved_segments` DROP FOREIGN KEY `saved_segments_created_by_fkey`;

-- DropTable
DROP TABLE `audit_logs`;

-- DropTable
DROP TABLE `invites`;

-- DropTable
DROP TABLE `saved_segments`;

-- CreateTable
CREATE TABLE `user_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(128) NOT NULL,
    `type` ENUM('refresh', 'reset', 'invite') NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_tokens_user_id_type_idx`(`user_id`, `type`),
    INDEX `idx_user_token_hash`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_tokens` ADD CONSTRAINT `user_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
