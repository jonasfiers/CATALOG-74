#!/bin/bash
# run-batch.sh — the actual batch cycle. cobol/jcl/RUN-BATCH.jcl
# documents this same sequence of steps as it would look submitted to
# a real mainframe's JES; this script is what actually executes,
# since there's no real JES/DFSORT here to hand it to.
set -e

DATA_DIR="${DATA_DIR:-.}"
BIN_DIR="${BIN_DIR:-.}"
cd "$DATA_DIR"

echo "[$(date)] batch run starting"

# Sort by GROUP-ID + OWER-ID (SHARE-REC) / GROUP-ID + PAYER-ID
# (EXPENSE-REC) -- both fields sit at the same byte offset, columns
# 11-22, in either record. CALC-OWED and CALC-PAID both assume their
# input already arrives in this order; they do no sorting themselves.
sort -k1.11,1.22 -o SHARE-SORTED.DAT SHARE-TRANS.DAT
sort -k1.11,1.22 -o EXPENSE-SORTED.DAT EXPENSE-MASTER.DAT

"$BIN_DIR/calc-owed"
"$BIN_DIR/calc-paid"
"$BIN_DIR/merge-balance"

echo "[$(date)] batch run complete -- BALANCE-MASTER.DAT refreshed"
