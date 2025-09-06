-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('BASIC', 'SECONDARY', 'TERTIARY');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'FINANCE', 'SECURITY', 'LIBRARIAN', 'TEACHER_LEAD');

-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('TEACHER', 'NON_TEACHER');

-- CreateTable
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contactInfo" TEXT,
    "type" "SchoolType" NOT NULL,
    "accreditationNo" TEXT,
    "establishedDate" TIMESTAMP(3),

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "headId" INTEGER,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "staffNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "staffType" "StaffType" NOT NULL,
    "departmentId" INTEGER,
    "contactInfo" TEXT,
    "email" TEXT,
    "employmentDate" TIMESTAMP(3),

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_username_key" ON "School"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Department_username_key" ON "Department"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Department_headId_key" ON "Department"("headId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_username_key" ON "Staff"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_staffNo_key" ON "Staff"("staffNo");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_headId_fkey" FOREIGN KEY ("headId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
