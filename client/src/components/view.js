import { Link, useParams } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
import axiosRetry, { exponentialDelay } from "axios-retry"
import { avatar } from './misc_functions';
import { match_weekly_rankings } from './projections_stats';
import sleeperLogo from '../images/sleeper_icon.png';
const Leagues = React.lazy(() => import('./leagues'));
const PlayerShares = React.lazy(() => import('./playershares'));
const Leaguemates = React.lazy(() => import('./leaguemates'));

const View = () => {
    const params = useParams();
    const isInitialRender = useRef(true);
    const [isLoading, setIsLoading] = useState(false);
    const [stateAllPlayers, setStateAllPlayers] = useState({});
    const [stateWeeklyRankings, setStateWeeklyRankings] = useState([]);
    const [state_user, setState_User] = useState(false);
    const [stateLeagues, setStateLeagues] = useState([]);
    const [stateLeaguemates, setStateLeaguemates] = useState([]);
    const [statePlayerShares, setStatePlayerShares] = useState([]);
    const [stateLeaguesFiltered, setStateLeaguesFiltered] = useState([]);
    const [stateLeaguematesFiltered, setStateLeaguematesFiltered] = useState([]);
    const [statePlayerSharesFiltered, setStatePlayerSharesFiltered] = useState([]);
    const [tab, setTab] = useState('Leagues');
    const [type1, setType1] = useState('All');
    const [type2, setType2] = useState('All');

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
                }
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

    useEffect(() => {
        const fetchFiltered = () => {
            const filter1 = type1
            const filter2 = type2
            const leagues = stateLeagues
            const leaguemates = stateLeaguemates
            const playershares = statePlayerShares
            let filteredLeagues;
            let filteredLeaguemates;
            let filteredPlayerShares;
            switch (filter1) {
                case ('Redraft'):
                    filteredLeagues = leagues.filter(x => x.settings.type !== 2);
                    filteredLeaguemates = leaguemates.map(lm => {
                        return {
                            ...lm,
                            leagues: lm.leagues.filter(x => x.settings.type !== 2)
                        }
                    })
                    filteredPlayerShares = playershares.map(player => {
                        return {
                            ...player,
                            leagues_owned: player.leagues_owned.filter(x => x.settings.type !== 2)
                        }
                    })
                    break;
                case ('All'):
                    filteredLeagues = leagues;
                    filteredLeaguemates = leaguemates.map(lm => {
                        return {
                            ...lm,
                            leagues: lm.leagues
                        }
                    })
                    filteredPlayerShares = playershares.map(player => {
                        return {
                            ...player,
                            leagues_owned: player.leagues_owned
                        }
                    })
                    break;
                case ('Dynasty'):
                    filteredLeagues = leagues.filter(x => x.settings.type === 2)
                    filteredLeaguemates = leaguemates.map(lm => {
                        return {
                            ...lm,
                            leagues: lm.leagues.filter(x => x.settings.type === 2)
                        }
                    })
                    filteredPlayerShares = playershares.map(player => {
                        return {
                            ...player,
                            leagues_owned: player.leagues_owned.filter(x => x.settings.type === 2)
                        }
                    })
                    break;
                default:
                    filteredLeagues = leagues;
                    filteredLeaguemates = leaguemates.map(lm => {
                        return {
                            ...lm,
                            leagues: lm.leagues
                        }
                    })
                    filteredPlayerShares = playershares.map(player => {
                        return {
                            ...player,
                            leagues_owned: player.leagues_owned
                        }
                    })
                    break;
            }
            let filteredLeagues2 = filteredLeagues
            let filteredLeaguemates2 = filteredLeaguemates
            let filteredPlayerShares2 = filteredPlayerShares
            switch (filter2) {
                case ('Bestball'):
                    filteredLeagues2 = filteredLeagues.filter(x => x.settings.best_ball === 1);
                    filteredLeaguemates2 = filteredLeaguemates.map(lm => {
                        return {
                            ...lm,
                            leagues: lm.leagues.filter(x => x.settings.best_ball === 1)
                        }
                    })
                    filteredPlayerShares2 = filteredPlayerShares.map(player => {
                        return {
                            ...player,
                            leagues_owned: player.leagues_owned.filter(x => x.settings.best_ball === 1)
                        }
                    })
                    break;
                case ('All'):
                    filteredLeagues2 = filteredLeagues;
                    filteredLeaguemates2 = filteredLeaguemates.map(lm => {
                        return {
                            ...lm,
                            leagues: lm.leagues
                        }
                    })
                    filteredPlayerShares2 = filteredPlayerShares.map(player => {
                        return {
                            ...player,
                            leagues_owned: player.leagues_owned
                        }
                    })
                    break;
                case ('Standard'):
                    filteredLeagues2 = filteredLeagues.filter(x => x.settings.best_ball !== 1);
                    filteredLeaguemates2 = filteredLeaguemates.map(lm => {
                        return {
                            ...lm,
                            leagues: lm.leagues.filter(x => x.best_ball !== 1)
                        }
                    })
                    filteredPlayerShares2 = filteredPlayerShares.map(player => {
                        return {
                            ...player,
                            leagues_owned: player.leagues_owned.filter(x => x.settings.best_ball !== 1)
                        }
                    })
                    break;
                default:
                    filteredLeagues2 = filteredLeagues;
                    filteredLeaguemates2 = filteredLeaguemates.map(lm => {
                        return {
                            ...lm,
                            leagues: lm.leagues
                        }
                    })
                    filteredPlayerShares2 = filteredPlayerShares.map(player => {
                        return {
                            ...player,
                            leagues_owned: player.leagues_owned
                        }
                    })
                    break;
            }

            setStateLeaguesFiltered([...filteredLeagues2])
            setStateLeaguematesFiltered([...filteredLeaguemates2])
            setStatePlayerSharesFiltered([...filteredPlayerShares2])
        }
        if (isInitialRender.current) {
            isInitialRender.current = false
        } else {
            fetchFiltered()
        }
    }, [type1, type2, stateLeagues])

    const totals = (
        isLoading ? null :
            <table className="summary">
                <tbody>
                    <tr>
                        <td colSpan={6} className="bold">{stateLeaguesFiltered.length} Leagues</td>
                    </tr>
                    <tr>
                        <th>W</th>
                        <th>L</th>
                        <th>T</th>
                        <th>WPCT</th>
                        <th>Pts For</th>
                        <th>Pts Against</th>
                    </tr>
                    <tr>
                        <td>
                            {
                                stateLeaguesFiltered.reduce((acc, cur) => acc + cur.userRoster.settings?.wins || 0, 0)
                            }
                        </td>
                        <td>
                            {
                                stateLeaguesFiltered.reduce((acc, cur) => acc + cur.userRoster.settings?.losses || 0, 0)
                            }
                        </td>
                        <td>
                            {
                                stateLeaguesFiltered.reduce((acc, cur) => acc + cur.userRoster.settings?.ties || 0, 0)
                            }
                        </td>
                        <td>
                            <em>
                                {
                                    (
                                        stateLeaguesFiltered.reduce((acc, cur) => acc + cur.userRoster.settings?.wins || 0, 0) /
                                        stateLeaguesFiltered.reduce((acc, cur) => acc + (cur.userRoster.settings?.wins || 0) +
                                            (cur.userRoster.settings?.losses || 0) + (cur.userRoster.settings?.ties || 0), 0)
                                    ).toLocaleString("en-US", {
                                        maximumFractionDigits: 4,
                                        minimumFractionDigits: 4
                                    })
                                }
                            </em>
                        </td>
                        <td>
                            {
                                stateLeaguesFiltered.reduce((acc, cur) => acc + cur.userRoster.settings?.fpts || 0, 0).toLocaleString("en-US", {
                                    maximumFractionDigits: 2
                                })
                            } pts
                        </td>
                        <td>
                            {
                                stateLeaguesFiltered.reduce((acc, cur) => acc + cur.userRoster.settings?.fpts_against || 0, 0).toLocaleString("en-US", {
                                    maximumFractionDigits: 2
                                })
                            } pts
                        </td>
                    </tr>
                </tbody>
            </table>
    )

    let loadingMessage = (
        <div>
            <h2>
                Loading Leagues...
            </h2>
            <div className='logo_wrapper'>
                <img src={sleeperLogo} alt={'logo'} />
                <div className='z one'>Z</div>
                <div className='z two'>Z</div>
                <div className='z three'>Z</div>
            </div>
        </div>
    )

    let display;
    switch (tab) {
        case 'Leagues':
            display = isLoading ? loadingMessage :
                <React.Suspense fallback={loadingMessage}>
                    <Leagues
                        prop_leagues={stateLeaguesFiltered}
                        weekly_rankings={stateWeeklyRankings}
                        allplayers={stateAllPlayers}
                        user_id={state_user.user_id}
                        avatar={avatar}
                    />
                </React.Suspense>
            break;
        case 'Players':
            display = isLoading ? loadingMessage :
                <React.Suspense fallback={loadingMessage}>
                    <PlayerShares
                        player_shares={statePlayerSharesFiltered}
                        weekly_rankings={stateWeeklyRankings}
                        allplayers={stateAllPlayers}
                        user_id={state_user.user_id}
                        avatar={avatar}
                    />
                </React.Suspense>
            break;
        case 'Leaguemates':
            display = isLoading ? loadingMessage :
                <React.Suspense fallback={
                    <div className='logo_wrapper'>
                        <div className='z one'>Z</div>
                        <div className='z two'>Z</div>
                        <div className='z three'>Z</div>
                    </div>
                }>
                    <Leaguemates
                        leaguemates={stateLeaguematesFiltered}
                        user_id={state_user.user_id}
                        username={state_user.display_name}
                        avatar={avatar}
                    />
                </React.Suspense>
            break;
        default:
            break;
    }


    return <>
        <div id={'view'}>
            <Link to="/" className="home">
                Home
            </Link>
            {
                state_user === 'Invalid' ? <h1 className="error">USERNAME NOT FOUND</h1> :
                    !state_user ? <h1>Loading...</h1> :
                        <>
                            <div className="heading">
                                <h1>
                                    <p className="image">
                                        {
                                            avatar(state_user.avatar, state_user.display_name, 'user')
                                        }
                                        <strong>
                                            {state_user.display_name}
                                        </strong>
                                    </p>
                                </h1>
                                <div className="navbar">
                                    <button
                                        className={tab === 'Leagues' ? 'active clickable' : 'clickable'}
                                        onClick={() => setTab('Leagues')}>
                                        Leagues
                                    </button>
                                    <button
                                        className={tab === 'Players' ? 'active clickable' : 'clickable'}
                                        onClick={() => setTab('Players')}>
                                        Players
                                    </button>
                                    <button
                                        className={tab === 'Leaguemates' ? 'active clickable' : 'clickable'}
                                        onClick={() => setTab('Leaguemates')}>
                                        Leaguemates
                                    </button>
                                </div>
                                <div className="switch_wrapper">
                                    <div className="switch">
                                        <button className={type1 === 'Redraft' ? 'active clickable' : 'clickable'} onClick={() => setType1('Redraft')}>Redraft</button>
                                        <button className={type1 === 'All' ? 'active clickable' : 'clickable'} onClick={() => setType1('All')}>All</button>
                                        <button className={type1 === 'Dynasty' ? 'active clickable' : 'clickable'} onClick={() => setType1('Dynasty')}>Dynasty</button>
                                    </div>
                                    <div className="switch">
                                        <button className={type2 === 'Bestball' ? 'active clickable' : 'clickable'} onClick={() => setType2('Bestball')}>Bestball</button>
                                        <button className={type2 === 'All' ? 'active clickable' : 'clickable'} onClick={() => setType2('All')}>All</button>
                                        <button className={type2 === 'Standard' ? 'active clickable' : 'clickable'} onClick={() => setType2('Standard')}>Standard</button>
                                    </div>
                                </div>
                                <div className="summary">
                                    {totals}
                                </div>
                            </div>
                            <div className={'tab'}>
                                {display}
                            </div>
                        </>
            }
        </div>
    </>
}

export default View;