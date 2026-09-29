-- CreateEnum
CREATE TYPE "NoticeKind" AS ENUM ('STOCK_BAS', 'ECHEANCE');

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kind" "NoticeKind" NOT NULL,
    "severity" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OUVERTE',
    "sparePartId" TEXT,
    "deadlineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notice_companyId_status_idx" ON "Notice"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Notice_companyId_dedupeKey_key" ON "Notice"("companyId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
