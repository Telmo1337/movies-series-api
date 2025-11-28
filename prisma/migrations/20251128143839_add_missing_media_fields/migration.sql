-- AlterTable
ALTER TABLE `Media` ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `director` VARCHAR(191) NULL,
    ADD COLUMN `language` VARCHAR(191) NULL,
    ADD COLUMN `platform` JSON NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NULL;
