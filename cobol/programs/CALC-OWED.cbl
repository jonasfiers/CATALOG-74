       IDENTIFICATION DIVISION.
       PROGRAM-ID. CALC-OWED.

      *> Reads SHARE-TRANS, already sorted by GROUP-ID then OWER-ID
      *> (sorting is its own step before this program runs -- same
      *> division of labor as a JCL job with a DFSORT step ahead of
      *> the COBOL step). Produces one AMOUNT-OWED record per person
      *> per group: the sum of every share they owe.
      *>
      *> This is COBOL's answer to Cypher's sum() -- a control break.
      *> As long as the key stays the same, keep accumulating. The
      *> instant it changes, the running total for the OLD key is
      *> final, so write it out before starting the new one.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT SHARE-IN ASSIGN TO SHARE-IN-PATH
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT OWED-OUT ASSIGN TO OWED-OUT-PATH
               ORGANIZATION IS LINE SEQUENTIAL.

       DATA DIVISION.
       FILE SECTION.
       FD  SHARE-IN.
       COPY "SHARE-REC.cpy".

       FD  OWED-OUT.
       COPY "AMOUNT-OWED-REC.cpy".

       WORKING-STORAGE SECTION.
       01  SHARE-IN-PATH           PIC X(100) VALUE "SHARE-SORTED.DAT".
       01  OWED-OUT-PATH           PIC X(100) VALUE "AMOUNT-OWED.DAT".

       01  WS-EOF                  PIC X VALUE "N".
           88  END-OF-FILE         VALUE "Y".
       01  WS-FIRST-RECORD         PIC X VALUE "Y".
           88  IS-FIRST-RECORD     VALUE "Y".

       01  WS-CUR-GROUP            PIC 9(6).
       01  WS-CUR-USER             PIC 9(6).
       01  WS-RUNNING-TOTAL        PIC 9(7)V99 VALUE ZERO.

       PROCEDURE DIVISION.
       MAIN-LOGIC.
           OPEN INPUT SHARE-IN
           OPEN OUTPUT OWED-OUT

           PERFORM READ-SHARE

           PERFORM UNTIL END-OF-FILE
               IF IS-FIRST-RECORD
                   MOVE GROUP-ID OF SHARE-REC TO WS-CUR-GROUP
                   MOVE OWER-ID OF SHARE-REC  TO WS-CUR-USER
                   MOVE "N" TO WS-FIRST-RECORD
               END-IF

               IF GROUP-ID OF SHARE-REC NOT = WS-CUR-GROUP
                  OR OWER-ID OF SHARE-REC NOT = WS-CUR-USER
                   PERFORM WRITE-BALANCE
                   MOVE GROUP-ID OF SHARE-REC TO WS-CUR-GROUP
                   MOVE OWER-ID OF SHARE-REC  TO WS-CUR-USER
                   MOVE ZERO TO WS-RUNNING-TOTAL
               END-IF

               ADD SHARE-AMOUNT OF SHARE-REC TO WS-RUNNING-TOTAL
               PERFORM READ-SHARE
           END-PERFORM

      *> the last group in the file never hits the "key changed"
      *> branch above -- its total only ever gets flushed here.
           IF NOT IS-FIRST-RECORD
               PERFORM WRITE-BALANCE
           END-IF

           CLOSE SHARE-IN
           CLOSE OWED-OUT
           STOP RUN.

       READ-SHARE.
           READ SHARE-IN
               AT END MOVE "Y" TO WS-EOF
           END-READ.

       WRITE-BALANCE.
           MOVE WS-CUR-GROUP     TO AO-GROUP-ID
           MOVE WS-CUR-USER      TO AO-USER-ID
           MOVE WS-RUNNING-TOTAL TO AO-TOTAL-OWED
           WRITE AMOUNT-OWED-REC.
