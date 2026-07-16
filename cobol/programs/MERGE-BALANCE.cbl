       IDENTIFICATION DIVISION.
       PROGRAM-ID. MERGE-BALANCE.

      *> Classic COBOL matched merge: walk two sorted files in lock-
      *> step, comparing keys at every step. This is what a SQL JOIN
      *> or a Cypher pattern match does in one line -- here it's a
      *> hand-written state machine, because sequential file
      *> processing has no join operator of its own.
      *>
      *> Someone can appear in only one file -- paid for things but
      *> never owed a share, or owes a share but never paid for
      *> anything themselves -- so all three cases (matched, owed-
      *> only, paid-only) have to be handled explicitly. A JOIN
      *> hides this; a merge cannot.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT OWED-IN ASSIGN TO OWED-IN-PATH
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT PAID-IN ASSIGN TO PAID-IN-PATH
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT BALANCE-OUT ASSIGN TO BALANCE-OUT-PATH
               ORGANIZATION IS LINE SEQUENTIAL.

       DATA DIVISION.
       FILE SECTION.
       FD  OWED-IN.
       COPY "AMOUNT-OWED-REC.cpy".

       FD  PAID-IN.
       COPY "AMOUNT-PAID-REC.cpy".

       FD  BALANCE-OUT.
       COPY "BALANCE-REC.cpy".

       WORKING-STORAGE SECTION.
       01  OWED-IN-PATH            PIC X(100) VALUE "AMOUNT-OWED.DAT".
       01  PAID-IN-PATH            PIC X(100) VALUE "AMOUNT-PAID.DAT".
       01  BALANCE-OUT-PATH        PIC X(100) VALUE "BALANCE-MASTER.DAT".

       01  WS-OWED-EOF             PIC X VALUE "N".
           88  OWED-AT-END         VALUE "Y".
       01  WS-PAID-EOF             PIC X VALUE "N".
           88  PAID-AT-END         VALUE "Y".

       01  WS-CURRENT-DATE         PIC X(21).
       01  WS-TIMESTAMP            PIC 9(14).

       PROCEDURE DIVISION.
       MAIN-LOGIC.
           OPEN INPUT OWED-IN
           OPEN INPUT PAID-IN
           OPEN OUTPUT BALANCE-OUT

           MOVE FUNCTION CURRENT-DATE TO WS-CURRENT-DATE
           MOVE WS-CURRENT-DATE(1:14) TO WS-TIMESTAMP

           PERFORM READ-OWED
           PERFORM READ-PAID

           PERFORM UNTIL OWED-AT-END AND PAID-AT-END
               EVALUATE TRUE
                   WHEN OWED-AT-END
      *> nobody left owing anything -- whatever's left in PAID-IN
      *> only ever paid, never owed a share
                       PERFORM WRITE-PAID-ONLY
                       PERFORM READ-PAID

                   WHEN PAID-AT-END
      *> mirror case: this person owes but never paid for anything
                       PERFORM WRITE-OWED-ONLY
                       PERFORM READ-OWED

                   WHEN AO-GROUP-ID = AP-GROUP-ID
                    AND AO-USER-ID = AP-USER-ID
                       PERFORM WRITE-MATCHED
                       PERFORM READ-OWED
                       PERFORM READ-PAID

                   WHEN AO-GROUP-ID < AP-GROUP-ID
                    OR (AO-GROUP-ID = AP-GROUP-ID AND AO-USER-ID < AP-USER-ID)
      *> owed-side key sorts earlier -- this person has no matching
      *> paid record (yet, in this pass of the file)
                       PERFORM WRITE-OWED-ONLY
                       PERFORM READ-OWED

                   WHEN OTHER
      *> paid-side key sorts earlier -- mirror of the above
                       PERFORM WRITE-PAID-ONLY
                       PERFORM READ-PAID
               END-EVALUATE
           END-PERFORM

           CLOSE OWED-IN
           CLOSE PAID-IN
           CLOSE BALANCE-OUT
           STOP RUN.

       READ-OWED.
           READ OWED-IN
               AT END MOVE "Y" TO WS-OWED-EOF
           END-READ.

       READ-PAID.
           READ PAID-IN
               AT END MOVE "Y" TO WS-PAID-EOF
           END-READ.

       WRITE-MATCHED.
           MOVE AO-GROUP-ID      TO GROUP-ID OF BALANCE-REC
           MOVE AO-USER-ID       TO USER-ID OF BALANCE-REC
           MOVE AP-TOTAL-PAID    TO TOTAL-PAID OF BALANCE-REC
           MOVE AO-TOTAL-OWED    TO TOTAL-OWED OF BALANCE-REC
           COMPUTE NET-BALANCE OF BALANCE-REC = AP-TOTAL-PAID - AO-TOTAL-OWED
           PERFORM WRITE-BALANCE-RECORD.

       WRITE-OWED-ONLY.
           MOVE AO-GROUP-ID      TO GROUP-ID OF BALANCE-REC
           MOVE AO-USER-ID       TO USER-ID OF BALANCE-REC
           MOVE ZERO             TO TOTAL-PAID OF BALANCE-REC
           MOVE AO-TOTAL-OWED    TO TOTAL-OWED OF BALANCE-REC
           COMPUTE NET-BALANCE OF BALANCE-REC = ZERO - AO-TOTAL-OWED
           PERFORM WRITE-BALANCE-RECORD.

       WRITE-PAID-ONLY.
           MOVE AP-GROUP-ID      TO GROUP-ID OF BALANCE-REC
           MOVE AP-USER-ID       TO USER-ID OF BALANCE-REC
           MOVE AP-TOTAL-PAID    TO TOTAL-PAID OF BALANCE-REC
           MOVE ZERO             TO TOTAL-OWED OF BALANCE-REC
           COMPUTE NET-BALANCE OF BALANCE-REC = AP-TOTAL-PAID - ZERO
           PERFORM WRITE-BALANCE-RECORD.

       WRITE-BALANCE-RECORD.
           MOVE WS-TIMESTAMP TO AS-OF-TIMESTAMP OF BALANCE-REC
           WRITE BALANCE-REC.
