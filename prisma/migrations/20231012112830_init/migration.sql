-- CreateTable
CREATE TABLE `Book` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `ISBN` VARCHAR(191) NOT NULL,
    `loaned` BOOLEAN NOT NULL DEFAULT false,
    `readerId` INTEGER NULL,

    UNIQUE INDEX `Book_ISBN_key`(`ISBN`),
    INDEX `Book_readerId_fkey`(`readerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reader` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lending` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bookISBN` VARCHAR(191) NOT NULL,
    `readerId` INTEGER NOT NULL,

    INDEX `Lending_readerId_fkey`(`readerId`),
    INDEX `Lending_bookISBN_fkey`(`bookISBN`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Book` ADD CONSTRAINT `Book_readerId_fkey` FOREIGN KEY (`readerId`) REFERENCES `Reader`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lending` ADD CONSTRAINT `Lending_readerId_fkey` FOREIGN KEY (`readerId`) REFERENCES `Reader`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lending` ADD CONSTRAINT `Lending_bookISBN_fkey` FOREIGN KEY (`bookISBN`) REFERENCES `Book`(`ISBN`) ON DELETE RESTRICT ON UPDATE CASCADE;
