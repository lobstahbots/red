import { Match, } from "@/generated/prisma/client";

export interface Preferences {
    higherScoreWeight: number;
    competitivenessWeight: number;
    mustSeeTeams: number[];
    maxTime: number;
    dropoff: "linear" | "quick" | "medium" | "slow" | "none";
}

export const DEFAULT: Preferences = {
    higherScoreWeight: 1,
    competitivenessWeight: 0,
    mustSeeTeams: [],
    maxTime: 3 * 60 * 1000,
    dropoff: "medium",
};

function rank(
    matches: Match,
    preferences: Preferences,
    currTime: Date,
): number {
    const higherScore = Math.max(matches.red_score, matches.blue_score);
    const lowerScore = Math.min(matches.red_score, matches.blue_score);
    const scoreFactor =
        preferences.higherScoreWeight * higherScore +
        preferences.competitivenessWeight * (lowerScore / higherScore);
    const scaledTime = Math.min(
        (matches.time.getTime() - currTime.getTime()) / preferences.maxTime,
        1,
    );
    let timeFactor = 0;
    switch (preferences.dropoff) {
        case "linear":
            timeFactor = 1 - scaledTime;
            break;
        case "quick":
            timeFactor = Math.sqrt(1 - scaledTime);
            break;
        case "medium":
            timeFactor = Math.sqrt(1 - scaledTime ** 3);
            break;
        case "slow":
            timeFactor = Math.sqrt(1 - scaledTime ** 8);
            break;
        case "none":
            timeFactor = 1;
            break;
    }
    return scoreFactor * timeFactor;
}

export function get<T extends Match>(matches: T[], preferences: Preferences): T {
    const currTime = new Date();
    const matchesWith = [];
    const matchesWithout = [];
    const teamSet = new Set(preferences.mustSeeTeams);
    for (const match of matches) {
        if (match.time.getTime() - currTime.getTime() > preferences.maxTime) continue;
        if (match.teams.some(teamSet.has)) matchesWith.push(match);
        else matchesWithout.push(match);
    }
    if (matchesWith.length > 0) {
        matchesWith.sort((a, b) => rank(b, preferences, currTime) - rank(a, preferences, currTime));
        return matchesWith[0];
    } else {
        matchesWithout.sort((a, b) => rank(b, preferences, currTime) - rank(a, preferences, currTime));
        return matchesWithout[0];
    }
}