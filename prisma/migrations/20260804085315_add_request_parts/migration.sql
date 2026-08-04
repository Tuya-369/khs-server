-- CreateTable
CREATE TABLE "RequestPart" (
    "requestId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,

    CONSTRAINT "RequestPart_pkey" PRIMARY KEY ("requestId","partId")
);

-- CreateIndex
CREATE INDEX "RequestPart_partId_idx" ON "RequestPart"("partId");

-- AddForeignKey
ALTER TABLE "RequestPart" ADD CONSTRAINT "RequestPart_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RepairRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestPart" ADD CONSTRAINT "RequestPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;
