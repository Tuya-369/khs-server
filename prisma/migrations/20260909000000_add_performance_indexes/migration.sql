CREATE INDEX "MerchItem_isActive_createdAt_idx"
  ON "MerchItem"("isActive", "createdAt");

CREATE INDEX "MerchOrder_userId_orderedAt_idx"
  ON "MerchOrder"("userId", "orderedAt");

CREATE INDEX "MerchOrder_status_orderedAt_idx"
  ON "MerchOrder"("status", "orderedAt");

CREATE INDEX "MerchOrder_isReadByManager_orderedAt_idx"
  ON "MerchOrder"("isReadByManager", "orderedAt");