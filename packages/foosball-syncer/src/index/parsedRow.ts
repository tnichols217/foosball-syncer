export const SUBMIT_PREINTERVAL = 60*1000 // 1 minute interval for validation
export const SUBMIT_INTERVAL = 10*60*1000 // 10 minutes interval for validation

export type Scores = [number, number][];

// Matches the spreadsheet column names to the column names in the users table
export type UsersRowData = {
    "Timestamp": string;
    "Email Address": string;
    "Action": 'Submit Scores' | 'Validate Scores';
    "Scores": string;
    "Case ID of opponent": string;
    "Agree to the scores submitted by opponent?": "Yes" | "No";
};

export class ParsedRow {
    public Timestamp: Date;
    public Submitter: string;
    public Opponent: string;
    public Submit: boolean;
    public Scores: Scores;

    constructor(row: UsersRowData) {
        this.Timestamp = new Date(row["Timestamp"])
        this.Submitter = row["Email Address"].split("@")[0]
        this.Submit = row["Action"] === "Submit Scores"
        this.Scores = row["Scores"].split("\n").filter(row => row.length >= 3).map(row => row.split("-").map(a => parseInt(a))) as Scores
        this.Opponent = row["Case ID of opponent"]
    }
}

export class VerifiedInputs {
    public rows: ParsedRow[];

    public static fromUsersRowData(rows: UsersRowData[]): VerifiedInputs {
        return new VerifiedInputs(rows.map(row => new ParsedRow(row)))
    }

    constructor(rows: ParsedRow[]) {
        this.rows = rows
        this.validate()
    }

    getInputs(): ParsedRow[] {
        return this.rows
            .filter(row => row.Submit && row.Scores.length > 0)
            .sort(
                (a, b) => 
                    a.Timestamp.getTime() - b.Timestamp.getTime())
    }

    getValidators(): ParsedRow[] {
        return this.rows
            .filter(row => !row.Submit)
            .sort(
                (a, b) => 
                    a.Timestamp.getTime() - b.Timestamp.getTime())
    }

    validate(): void {
        let validators = this.getValidators();
        let inputs = this.getInputs();
        let o: ParsedRow[] = []
        for ( let inp of inputs ) {
            validators
                .splice(
                    0,
                    validators.findIndex(
                        val => inp.Timestamp.getUTCMilliseconds() - val.Timestamp.getUTCMilliseconds() < SUBMIT_PREINTERVAL
                    )
                )
            let valid = validators.findIndex(val => inp.Opponent == val.Submitter && val.Timestamp.getUTCMilliseconds() - inp.Timestamp.getUTCMilliseconds() < SUBMIT_INTERVAL)
            if (valid != -1) {
                o.push(inp)
                validators.splice(valid, 1)
            }
        }
        this.rows = o
    }
}