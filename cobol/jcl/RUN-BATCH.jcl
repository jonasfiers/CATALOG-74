//CATALOG7 JOB (ACCT),'NIGHTLY BALANCE RUN',CLASS=A,MSGCLASS=X,
//         NOTIFY=&SYSUID
//*
//* CATALOG-74 -- nightly batch cycle.
//*
//* Recomputes derived balances the same way Cypher's sum() does it
//* live, except every step has to be spelled out by hand: sort,
//* aggregate, aggregate, merge. This member documents the job as it
//* would actually be submitted to JES on a real mainframe. On this
//* project there's no real JES/DFSORT to submit it to, so it's not
//* executed -- cobol/scripts/run-batch.sh runs the equivalent
//* sequence instead. PGM= names below are truncated to 8 characters,
//* matching the traditional load-module-name limit.
//*
//SORTSHR  EXEC PGM=SORT
//SYSOUT   DD SYSOUT=*
//SORTIN   DD DSN=CATALOG74.SHARE.TRANS,DISP=SHR
//SORTOUT  DD DSN=CATALOG74.SHARE.SORTED,DISP=(NEW,CATLG,DELETE),
//         SPACE=(CYL,(5,5)),UNIT=SYSDA
//SYSIN    DD *
  SORT FIELDS=(11,12,CH,A)
/*
//*
//SORTEXP  EXEC PGM=SORT
//SYSOUT   DD SYSOUT=*
//SORTIN   DD DSN=CATALOG74.EXPENSE.MASTR,DISP=SHR
//SORTOUT  DD DSN=CATALOG74.EXPENSE.SORTD,DISP=(NEW,CATLG,DELETE),
//         SPACE=(CYL,(5,5)),UNIT=SYSDA
//SYSIN    DD *
  SORT FIELDS=(11,12,CH,A)
/*
//*
//CALCOWED EXEC PGM=CALCOWED
//STEPLIB  DD DSN=CATALOG74.LOADLIB,DISP=SHR
//SHAREIN  DD DSN=CATALOG74.SHARE.SORTED,DISP=SHR
//OWEDOUT  DD DSN=CATALOG74.AMOUNT.OWED,DISP=(NEW,CATLG,DELETE),
//         SPACE=(CYL,(2,2)),UNIT=SYSDA
//SYSOUT   DD SYSOUT=*
//*
//CALCPAID EXEC PGM=CALCPAID
//STEPLIB  DD DSN=CATALOG74.LOADLIB,DISP=SHR
//EXPIN    DD DSN=CATALOG74.EXPENSE.SORTD,DISP=SHR
//PAIDOUT  DD DSN=CATALOG74.AMOUNT.PAID,DISP=(NEW,CATLG,DELETE),
//         SPACE=(CYL,(2,2)),UNIT=SYSDA
//SYSOUT   DD SYSOUT=*
//*
//MERGEBAL EXEC PGM=MERGEBAL
//STEPLIB  DD DSN=CATALOG74.LOADLIB,DISP=SHR
//OWEDIN   DD DSN=CATALOG74.AMOUNT.OWED,DISP=SHR
//PAIDIN   DD DSN=CATALOG74.AMOUNT.PAID,DISP=SHR
//BALOUT   DD DSN=CATALOG74.BALANCE.MASTR,DISP=(NEW,CATLG,DELETE),
//         SPACE=(CYL,(2,2)),UNIT=SYSDA
//SYSOUT   DD SYSOUT=*
