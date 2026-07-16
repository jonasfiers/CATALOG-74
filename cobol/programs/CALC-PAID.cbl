       IDENTIFICATION DIVISION.
       PROGRAM-ID. CALC-PAID.

      *> Mirror of CALC-OWED, one field swap over: reads EXPENSE-MASTER
      *> (sorted by GROUP-ID then PAYER-ID) instead of SHARE-TRANS, and
      *> sums EXPENSE-AMOUNT instead of SHARE-AMOUNT. Same control-break
      *> shape, because "how much did each person pay in" and "how much
      *> does each person owe" are the same aggregation problem twice.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT EXPENSE-IN ASSIGN TO EXPENSE-IN-PATH
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT PAID-OUT ASSIGN TO PAID-OUT-PATH
               ORGANIZATION IS LINE SEQUENTIAL.

       DATA DIVISION.
       FILE SECTION.
       FD  EXPENSE-IN.
       COPY "EXPENSE-REC.cpy".

       FD  PAID-OUT.
       COPY "AMOUNT-PAID-REC.cpy".

       WORKING-STORAGE SECTION.
       01  EXPENSE-IN-PATH         PIC X(100) VALUE "EXPENSE-SORTED.DAT".
       01  PAID-OUT-PATH           PIC X(100) VALUE "AMOUNT-PAID.DAT".

       01  WS-EOF                  PIC X VALUE "N".
           88  END-OF-FILE         VALUE "Y".
       01  WS-FIRST-RECORD         PIC X VALUE "Y".
           88  IS-FIRST-RECORD     VALUE "Y".

       01  WS-CUR-GROUP            PIC 9(6).
       01  WS-CUR-USER             PIC 9(6).
       01  WS-RUNNING-TOTAL        PIC 9(7)V99 VALUE ZERO.

       PROCEDURE DIVISION.
       MAIN-LOGIC.
           OPEN INPUT EXPENSE-IN
           OPEN OUTPUT PAID-OUT

           PERFORM READ-EXPENSE

           PERFORM UNTIL END-OF-FILE
               IF IS-FIRST-RECORD
                   MOVE GROUP-ID OF EXPENSE-REC TO WS-CUR-GROUP
                   MOVE PAYER-ID OF EXPENSE-REC TO WS-CUR-USER
                   MOVE "N" TO WS-FIRST-RECORD
               END-IF

               IF GROUP-ID OF EXPENSE-REC NOT = WS-CUR-GROUP
                  OR PAYER-ID OF EXPENSE-REC NOT = WS-CUR-USER
                   PERFORM WRITE-BALANCE
                   MOVE GROUP-ID OF EXPENSE-REC TO WS-CUR-GROUP
                   MOVE PAYER-ID OF EXPENSE-REC TO WS-CUR-USER
                   MOVE ZERO TO WS-RUNNING-TOTAL
               END-IF

               ADD EXPENSE-AMOUNT OF EXPENSE-REC TO WS-RUNNING-TOTAL
               PERFORM READ-EXPENSE
           END-PERFORM

      *> same reason as CALC-OWED: the last payer in the file never
      *> hits the "key changed" branch, so it only gets flushed here.
           IF NOT IS-FIRST-RECORD
               PERFORM WRITE-BALANCE
           END-IF

           CLOSE EXPENSE-IN
           CLOSE PAID-OUT
           STOP RUN.

       READ-EXPENSE.
           READ EXPENSE-IN
               AT END MOVE "Y" TO WS-EOF
           END-READ.

       WRITE-BALANCE.
           MOVE WS-CUR-GROUP     TO AP-GROUP-ID
           MOVE WS-CUR-USER      TO AP-USER-ID
           MOVE WS-RUNNING-TOTAL TO AP-TOTAL-PAID
           WRITE AMOUNT-PAID-REC.
