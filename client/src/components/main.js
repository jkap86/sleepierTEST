import { useParams } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
import axiosRetry, { exponentialDelay } from "axios-retry"
import { match_weekly_rankings } from './projections_stats';
import View from "./view";

const Main = () => {
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [stateAllPlayers, setStateAllPlayers] = useState({});
    const [stateWeeklyRankings, setStateWeeklyRankings] = useState([]);
    const [state_user, setState_User] = useState(false);
    const [stateLeagues, setStateLeagues] = useState([]);
    const [stateLeaguemates, setStateLeaguemates] = useState([]);
    const [statePlayerShares, setStatePlayerShares] = useState([]);

    axiosRetry(axios, {
        retries: 5,
        retryCondition: () => {
            return true
        }
    })

    useEffect(() => {
        const fetchData = async () => {
            const allplayers = await axios.get('/allplayers')
            const weekly_rankings = await axios.get('/weeklyrankings')
            const matched_rankings = await match_weekly_rankings(weekly_rankings.data, allplayers.data)

            setStateAllPlayers(allplayers.data)
            setStateWeeklyRankings(matched_rankings)
        }
        fetchData()
    }, [])

    useEffect(() => {
        const syncAllPlayers = setInterval(() => {
            const fetchSync = async () => {
                const allplayers = await axios.get('/allplayers')
                setStateAllPlayers(allplayers.data)
            }
            fetchSync()
        }, 1000 * 60 * 60 * 24)
        return () => clearInterval(syncAllPlayers)

    }, [])

    useEffect(() => {
        const syncWeeklyRankings = setInterval(() => {
            const fetchSync = async () => {
                const weekly_rankings = await axios.get('/weeklyrankings')
                const matched_rankings = await match_weekly_rankings(weekly_rankings.data, stateAllPlayers)
                setStateWeeklyRankings(matched_rankings)
            }
            fetchSync()
        }, 1000 * 60 * 15)
        return () => clearInterval(syncWeeklyRankings)
    }, [stateAllPlayers])

    useEffect(() => {
        setIsLoading(true);
        const getPlayerShares = (leagues, user_id) => {
            const getPlayerCount = (players, user_id, leagues) => {
                let playerShares = [];
                players.map(player => {
                    const index = playerShares.findIndex(obj => {
                        return obj.id === player.id
                    })
                    if (index === -1) {
                        let leagues_owned = players.filter(x => x.id === player.id && x.manager?.user_id === user_id)
                        let leagues_taken = players.filter(x => x.id === player.id && x.manager?.user_id !== user_id)
                        playerShares.push({
                            id: player.id,
                            leagues_owned: leagues_owned,
                            leagues_taken: leagues_taken,
                            leagues_available: leagues.filter(x =>
                                !leagues_owned.find(y => y.league_id === x.league_id) &&
                                !leagues_taken.find(y => y.league_id === x.league_id)
                            )
                        })
                    }
                })

                return playerShares

            }

            let players_all = leagues.map(league => {
                let standings = [...league.rosters]
                let standings_pts = [...league.rosters]
                standings = standings.sort((a, b) =>
                    b.settings.wins - a.settings.wins || b.settings.fpts - a.settings.fpts ||
                    b.settings.fpts_decimal - a.settings.fpts_decimal
                )
                standings_pts = standings_pts.sort((a, b) =>
                    b.settings.fpts - a.settings.fpts || b.settings.fpts_decimal - a.settings.fpts_decimal
                )
                return league.rosters.map(roster => {
                    let rank = standings.findIndex(obj => {
                        return obj.owner_id === roster.owner_id || roster.co_owners?.includes(obj.owner_id)
                    }) + 1
                    let rank_pts = standings_pts.findIndex(obj => {
                        return obj.owner_id === roster.owner_id || roster.co_owners?.includes(obj.owner_id)
                    }) + 1
                    return roster.players?.map(player_id => {
                        return {
                            id: player_id,
                            status: (
                                roster.starters?.includes(player_id) ?
                                    'Starter' :
                                    roster.taxi?.includes(player_id) ?
                                        'Taxi' :
                                        roster.reserve?.includes(player_id) ?
                                            'IR' :
                                            'Bench'
                            ),
                            league_id: league.league_id,
                            league_name: league.name,
                            league_avatar: league.avatar,
                            total_rosters: league.total_rosters,
                            rosters: league.rosters,
                            userRoster: league.userRoster,
                            users: league.users,
                            settings: league.settings,
                            scoring_settings: league.scoring_settings,
                            rank: rank,
                            rank_pts: rank_pts,
                            roster: roster,
                            roster_positions: league.roster_positions,
                            dynasty: league.dynasty,
                            bestball: league.bestball,
                            manager: (league.users.find(x =>
                                x.user_id === roster.owner_id
                            )) || (league.users.find(x =>
                                roster.co_owners?.includes(x.user_id)
                            )) || {
                                display_name: 'Orphan',
                                user_id: 0
                            },
                            wins: roster.settings.wins,
                            losses: roster.settings.losses,
                            ties: roster.settings.ties,
                            fpts: parseFloat(`${roster.settings.fpts}.${roster.settings.fpts_decimal}`),
                            fpts_against: parseFloat(`${roster.settings.fpts_against}.${roster.settings.fpts_against_decimal}`)
                        }
                    })
                })
            }).flat(2)
            const playersCount = getPlayerCount(players_all.filter(x => x !== undefined), user_id, leagues)
            setStatePlayerShares(playersCount)
            setIsLoading(false);
        }

        const getLeaguemates = (leagues, user_id) => {
            const getLmCount = (leaguemates) => {
                let leaguematesCount = [];
                leaguemates.forEach(lm => {
                    const index = leaguematesCount.findIndex(obj => {
                        return obj.user_id === lm.user_id
                    })
                    if (index === -1) {
                        leaguematesCount.push({
                            user_id: lm.user_id,
                            display_name: lm.display_name,
                            avatar: lm.avatar,
                            leagues: [lm.league]
                        })
                    } else {
                        leaguematesCount[index].leagues.push(lm.league)
                    }
                })
                return leaguematesCount
            }

            let leaguemates_all = [];
            leagues.map(league => {
                let userRoster = league.rosters.find(x => x.owner_id === user_id || x.co_owners?.includes(user_id))

                if (userRoster) {
                    return league.users.map(user => {
                        let lmRoster = league.rosters.find(x => x.owner_id === user.user_id || x.co_owners?.includes(user.user_id))

                        if (lmRoster) {
                            return leaguemates_all.push({
                                ...user,
                                league: {
                                    ...league,
                                    lmroster: lmRoster,
                                    roster: userRoster
                                }
                            })
                        }
                        return console.log('No Leaguemate Roster')
                    })
                }

                return console.log('No User Roster')

            })

            let lmCount = getLmCount(leaguemates_all.filter(x => x !== '0'));

            setStateLeaguemates(lmCount);
        }
        const fetchLeagues = async (user) => {
            const leagues = await axios.get('/leagues', {
                params: {
                    user_id: user.user_id
                },
                timeout: 5000
            })
            setStateLeagues(leagues.data.leagues.sort((a, b) => a.index - b.index))

            getPlayerShares(leagues.data.leagues.filter(x => x !== null), user.user_id)
            getLeaguemates(leagues.data.leagues.filter(x => x !== null), user.user_id)
        }
        const fetchUser = async () => {
            const user = await axios.get(`/user`, {
                params: {
                    username: params.username
                }
            })
            setState_User(user.data)
            if (user.data !== 'Invalid') {
                fetchLeagues(user.data)
            }
        }
        fetchUser()

    }, [params.username])

    return <>
        <View
            isLoading={isLoading}
            stateAllPlayers={stateAllPlayers}
            stateWeeklyRankings={stateWeeklyRankings}
            state_user={state_user}
            stateLeagues={stateLeagues}
            stateLeaguemates={stateLeaguemates}
            statePlayerShares={statePlayerShares}
        />
    </>
}

export default Main;