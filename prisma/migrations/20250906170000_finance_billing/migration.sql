-- Finance & Billing schema updates

-- Create FeesAndCharges table
CREATE TABLE "FeesAndCharges" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "amountPerUnit" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    CONSTRAINT "FeesAndCharges_pkey" PRIMARY KEY ("id")
);

-- Alter Billing to add references to FeesAndCharges and itemization
ALTER TABLE "Billing"
    ADD COLUMN "feesAndChargesId" INTEGER NOT NULL,
    ADD COLUMN "quantity" INTEGER NOT NULL,
    ADD COLUMN "unit" TEXT NOT NULL;

-- Add foreign key constraint
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_feesAndChargesId_fkey" FOREIGN KEY ("feesAndChargesId") REFERENCES "FeesAndCharges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
