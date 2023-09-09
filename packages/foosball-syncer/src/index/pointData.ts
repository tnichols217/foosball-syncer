import { ParsedRow, Scores } from './parsedRow';

export const HALFLIFE = 14*24*60*60*1000 //14 days
export const SETWEIGHT = 0;
export const MATCHWEIGHT = 0;
export const ALLWEIGHT = 0;
export const WEIGHTWEIGHT = 1.5; // Weight combination weight

export class PointData {
    public score: [number, number]
    public weight: number

    constructor(score?: [number, number], weight?: number) {
        this.score = score || [0, 0]
        this.weight = weight || 0
    }
}

export class PeoplePointData {
    public pointData: PointData
    public opponent: string
    public submitter: string

    public static weightTime(time: Date, now: Date = new Date()) {
        let diff = now.getUTCMilliseconds() - time.getUTCMilliseconds()
        return Math.pow(0.5, (diff / HALFLIFE))
    }

    public static fromGame = (game: ParsedRow): PeoplePointData => {
        return this.combinePeoplePointData(this.gameToPointData(game))
    }

    public static gameToPointData = (game: ParsedRow): PeoplePointData[] => {
        let timeWeight = this.weightTime(game.Timestamp)
        let o = game.Scores.map(score => {
            return new PeoplePointData(
                new PointData(
                    [score[0] / (score[0] + score[1]), score[1] / (score[0] + score[1])],
                    (score[0] + score[1] + ALLWEIGHT) * timeWeight,
                ),
                game.Opponent,
                game.Submitter
            )
        })
        let sets = game.Scores
            .reduce<[number, number]>(
                (a, b) => {
                    return [a[0] + +(b[0] > b[1]), a[1] + +(b[0] < b[1])] // Count winner of sets
                }, [0, 0])
        o.push(
            new PeoplePointData(
                new PointData(
                    [sets[0] / (sets[0] + sets[1]), sets[1] / (sets[0] + sets[1])],
                    (sets[0] + sets[1] + ALLWEIGHT) * SETWEIGHT * timeWeight,
                ),
                game.Opponent,
                game.Submitter
            ),
            new PeoplePointData(
                new PointData(
                    [+(sets[0] > sets[1]), +(sets[0] < sets[1])],
                    (MATCHWEIGHT + ALLWEIGHT) * timeWeight,
                ),
                game.Opponent,
                game.Submitter
            )
        )
        return o
    }

    public static combinePeoplePointData = (pointData: PeoplePointData[]): PeoplePointData => {
        let Weights = pointData.map(p => p.pointData.weight)
        let W = Weights.reduce((a, b) => a + b)
        let Score = pointData
            .map(
                p => [
                        p.pointData.score[0] * p.pointData.weight,
                        p.pointData.score[1] * p.pointData.weight
                ]
            )
            .reduce(
                (a, b) => 
                    [a[0] + b[0], a[1] + b[1]],
                [0, 0]
            )
            .map(a => a / W)
        let Weight = Math.pow(Weights.map(w => Math.pow(w, WEIGHTWEIGHT)).reduce((a, b) => a + b), 1/WEIGHTWEIGHT)
        return new PeoplePointData(
            new PointData(
                Score as [number, number],
                Weight,
            ),
            pointData[0].opponent,
            pointData[0].submitter
        )
    }

    public combinePointData (pointData: PointData): void {
        let Weights = [this.pointData.weight + pointData.weight]
        let W = Weights.reduce((a, b) => a + b)
        let pD = [this.pointData, pointData]
        this.pointData.score = pD
            .map(
                p => [
                        p.score[0] * p.weight,
                        p.score[1] * p.weight
                ]
            )
            .reduce(
                (a, b) => 
                    [a[0] + b[0], a[1] + b[1]],
                [0, 0]
            )
            .map(a => a / W) as [number, number]
        this.pointData.weight = Math.pow(
            Weights
                .map(w => Math.pow(w, WEIGHTWEIGHT))
                .reduce((a, b) => a + b),
            1/WEIGHTWEIGHT
        )
        
    }

    constructor(pointData: PointData, opponent: string, submitter: string) {
        this.pointData = new PointData()
        this.pointData.weight = pointData.weight;
        if (submitter > opponent) {
            this.pointData.score = pointData.score;
            this.opponent = opponent;
            this.submitter = submitter;
        } else {
            this.opponent = submitter;
            this.submitter = opponent;
            this.pointData.score = [pointData.score[1], pointData.score[0]];
        }
    }
}

export class PeoplePointBucket {
    public bucket: {
        [key: string]: {
            [key: string]: PointData
        }
    }

    constructor(pointData: PeoplePointData[] = []) {
        this.bucket = {}
        this.addPointData(pointData)
    }

    addPointDatum = (pointData: PeoplePointData): void => {
        if (this.bucket[pointData.submitter] == undefined) {
            this.bucket[pointData.submitter] = {}
        }

        if (this.bucket[pointData.submitter][pointData.opponent] == undefined) {
            this.bucket[pointData.submitter][pointData.opponent] = new PointData()
        }

        pointData.combinePointData(
            this.bucket[pointData.submitter][pointData.opponent]
        )

        this.bucket[pointData.submitter][pointData.opponent] = pointData.pointData
    }

    addPointData = (pointData: PeoplePointData[]): void => {
        pointData.forEach(p => this.addPointDatum(p))
    }
}