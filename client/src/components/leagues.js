import React, { useState, useEffect, useRef } from "react";
import { getLineupCheck } from './projections_stats';
const Search = React.lazy(() => import('./search'));
const LeagueRosters = React.lazy(() => import('./leagueRosters'));
const LineupBreakdown = React.lazy(() => import('./lineupBreakdown'));

const Leagues = ({ prop_leagues, weekly_rankings, allplayers, user_id, avatar }) => {
    const [leagues, setLeagues] = useState([])
    const [searched, setSearched] = useState('')
    const [page, setPage] = useState(1)
    const [rostersVisible, setRostersVisible] = useState('')
    const [lineupCheck, setLineupCheck] = useState(false);
    const [sortedBy, setSortedBy] = useState({
        by: 'default',
        descending: true
    })
    const rowRef = useRef(null)

    const sortLeagues = (sort_by) => {
        let l = leagues
        let sb = sortedBy
        let d = sb.by === sort_by ? !sb.descending : true

        switch (sort_by) {
            case 'Record':
                if (sb.descending) {
                    l = l.sort((a, b) =>
                        (b.userRoster.settings.wins / (b.userRoster.settings.wins + b.userRoster.settings.losses + b.userRoster.settings.ties)) -
                        (a.userRoster.settings.wins / (a.userRoster.settings.wins + a.userRoster.settings.losses + a.userRoster.settings.ties))
                    )
                } else {
                    l = l.sort((a, b) =>
                        (a.userRoster.settings.wins / (a.userRoster.settings.wins + a.userRoster.settings.losses + a.userRoster.settings.ties)) -
                        (b.userRoster.settings.wins / (b.userRoster.settings.wins + b.userRoster.settings.losses + b.userRoster.settings.ties))
                    )
                }
                break;
            case 'PF':
                if (sb.descending) {
                    l = l.sort((a, b) =>
                        b.userRoster.settings.fpts - a.userRoster.settings.fpts ||
                        b.userRoster.settings.fpts_decimal - a.userRoster.settings.fpts_decimal
                    )
                } else {
                    l = l.sort((a, b) =>
                        a.userRoster.settings.fpts - b.userRoster.settings.fpts ||
                        a.userRoster.settings.fpts_decimal - b.userRoster.settings.fpts_decimal
                    )
                }
                break;
            case 'Rank (Ovr)':
                if (sb.descending) {
                    l = l.sort((a, b) => a.rank - b.rank)
                } else {
                    l = l.sort((a, b) => b.rank - a.rank)
                }
                break;
            case 'Rank (PF)':
                if (sb.descending) {
                    l = l.sort((a, b) => a.rank_points - b.rank_points)
                } else {
                    l = l.sort((a, b) => b.rank_points - a.rank_points)
                }
                break;
            case 'League':
                if (sb.descending) {
                    l = l.sort((a, b) => a.index - b.index)
                } else {
                    l = l.sort((a, b) => a.name > b.name ? 1 : -1)
                }
                break;
            case 'SO Slots':
                if (sb.descending) {
                    l = l.sort((a, b) => a.so_slots - b.so_slots)
                } else {
                    l = l.sort((a, b) => b.so_slots - a.so_slots)
                }
                break;
            case 'Empty Slots':
                if (sb.descending) {
                    l = l.sort((a, b) => a.empty_slots - b.empty_slots)
                } else {
                    l = l.sort((a, b) => b.empty_slots - a.empty_slots)
                }
                break;
            default:
                break;
        }
        setSortedBy({
            by: sort_by,
            descending: d
        })
        setLeagues([...l])
    }

    useEffect(() => {
        window.scrollTo({
            top: rowRef.current?.offsetTop,
            left: 0,
            behavior: 'auto'
        })
    }, [page])

    useEffect(() => {
        const l = prop_leagues.map((league, index) => {
            league['index'] = index
            const standings = league.rosters.sort((a, b) =>
                b.settings.wins - a.settings.wins || b.settings.losses - a.settings.losses ||
                b.settings.fpts - a.settings.fpts
            )
            const rank = standings.findIndex(obj => {
                return obj.owner_id === user_id || obj.co_owners?.includes(user_id)
            })
            league['rank'] = rank + 1
            const standings_points = league.rosters.sort((a, b) =>
                b.settings.fpts - a.settings.fpts || b.settings.wins - a.settings.wins
            )
            const rank_points = standings_points.findIndex(obj => {
                return obj.owner_id === user_id || obj.co_owners?.includes(user_id)
            })
            league['rank_points'] = rank_points + 1

            league['empty_slots'] = league.userRoster.starters.filter(s => s === '0').length
            league['so_slots'] = getLineupCheck(league.roster_positions, league.userRoster, weekly_rankings, allplayers)
                .filter(slot => slot.subs.length > 0).length

            return league
        })
        setLeagues([...l])
    }, [prop_leagues])

    const leagues_display = searched.trim().length === 0 ? leagues :
        leagues.filter(x => x.name.trim() === searched.trim())

    const header_standings = (
        <>
            <tr className="main_header single">
                <th colSpan={4}
                    className={'clickable'}
                    onClick={() => sortLeagues('League')}
                >
                    League
                </th>
                <th colSpan={3}
                    className={'clickable'}
                    onClick={() => sortLeagues('Record')}
                >
                    Record
                </th>
                <th colSpan={4}
                    className={'clickable'}
                    onClick={() => sortLeagues('PF')}
                >
                    PF - PA
                </th>
                <th colSpan={1}
                    className={'small clickable'}
                    onClick={() => sortLeagues('Rank (Ovr)')}
                >
                    Rank (Ovr)
                </th>
                <th colSpan={1}
                    className={'small clickable'}
                    onClick={() => sortLeagues('Rank (PF)')}
                >
                    Rank (PF)
                </th>
            </tr>
        </>
    )
    const header_lineup_check = (
        <>
            <tr className="main_header single">
                <th colSpan={4}
                    className={'clickable'}
                    onClick={() => sortLeagues('League')}
                >
                    League
                </th>
                <th colSpan={2}
                    className={'clickable'}
                    onClick={() => sortLeagues('Empty Slots')}
                >
                    Empty Starter Slots
                </th>
                <th colSpan={2}
                    className={'clickable'}
                    onClick={() => sortLeagues('SO Slots')}
                >
                    Suboptimal Slots
                </th>
            </tr>
        </>
    )

    const display_standings = (
        <>
            {
                leagues_display
                    .slice(Math.max((page - 1) * 25, 0), ((page - 1) * 25) + 25)
                    .map((league, index) =>
                        <tbody
                            key={`${league.league_id}_${index}`}
                            className={rostersVisible === league.league_id ? 'active' : null}
                        >
                            <tr>
                                <td colSpan={13} >
                                    <table className={`table${1}`}>
                                        <tbody>
                                            <tr
                                                ref={index === 0 ? rowRef : null}
                                                className={rostersVisible === league.league_id ? 'main_row active clickable' : 'main_row clickable'}
                                                onClick={() => setRostersVisible(prevState => prevState === league.league_id ? '' : league.league_id)}
                                            >
                                                <td colSpan={4} className={'left'}>
                                                    <p>
                                                        {
                                                            avatar(league.avatar, league.name, 'league')
                                                        }
                                                        {league.name}
                                                    </p>
                                                </td>
                                                <td colSpan={3}>
                                                    {
                                                        `${league.userRoster.settings.wins}-${league.userRoster.settings.losses}${league.userRoster.settings.ties > 0 ? `-${league.userRoster.settings.ties}` : ''}`
                                                    }
                                                    &nbsp;&nbsp;
                                                    <em>
                                                        {
                                                            (league.userRoster.settings.wins / Math.max((league.userRoster.settings.wins + league.userRoster.settings.losses + league.userRoster.settings.ties)), 1).toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 4 })
                                                        }
                                                    </em>
                                                </td>
                                                <td colSpan={4}>
                                                    {
                                                        league.userRoster.settings.fpts?.toLocaleString("en-US")
                                                    } - {
                                                        league.userRoster.settings.fpts_against?.toLocaleString("en-US")
                                                    }
                                                </td>
                                                <td>
                                                    <p
                                                        className={
                                                            (league.rank / league.total_rosters) <= .25 ? 'green' :
                                                                (league.rank / league.total_rosters) >= .75 ? 'red' :
                                                                    null
                                                        }
                                                    >
                                                        {
                                                            league.rank
                                                        }
                                                    </p>
                                                </td>
                                                <td>
                                                    <p
                                                        className={
                                                            (league.rank_points / league.total_rosters) <= .25 ? 'green' :
                                                                (league.rank_points / league.total_rosters) >= .75 ? 'red' :
                                                                    null
                                                        }
                                                    >
                                                        {
                                                            league.rank_points
                                                        }
                                                    </p>
                                                </td>
                                            </tr>
                                            {
                                                rostersVisible !== league.league_id ? null :
                                                    <tr>
                                                        <td colSpan={13}>
                                                            <div className={`nav2`}></div>
                                                            <React.Suspense fallback={
                                                                <div className='logo_wrapper'>
                                                                    <div className='z one'>Z</div>
                                                                    <div className='z two'>Z</div>
                                                                    <div className='z three'>Z</div>
                                                                </div>}>
                                                                <LeagueRosters
                                                                    type={2}
                                                                    rosters={league.rosters}
                                                                    users={league.users}
                                                                    avatar={avatar}
                                                                    roster_positions={league.roster_positions}
                                                                    user_id={user_id}
                                                                    allplayers={allplayers}
                                                                />
                                                            </React.Suspense>
                                                        </td>
                                                    </tr>
                                            }
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    )
            }
            {
                (((page - 1) * 25) + 25) < leagues_display.length ?
                    <tbody>
                        <tr
                            className={'clickable'}
                            onClick={() => setPage(prevState => prevState + 1)}
                        >
                            <td colSpan={13}>NEXT PAGE</td>
                        </tr>
                    </tbody>
                    :
                    null
            }
        </>
    )
    const display_lineup_check = (
        <>
            {
                leagues_display
                    .slice(Math.max((page - 1) * 25, 0), ((page - 1) * 25) + 25)
                    .map((league, index) =>
                        <tbody
                            key={`${league.league_id}_${index}`}
                            className={rostersVisible === league.league_id ? 'active' : null}
                        >
                            <tr>
                                <td colSpan={8} >
                                    <table className={`table${1}`}>
                                        <tbody>
                                            <tr
                                                ref={index === 0 ? rowRef : null}
                                                className={rostersVisible === league.league_id ? 'main_row active clickable' : 'main_row clickable'}
                                                onClick={() => setRostersVisible(prevState => prevState === league.league_id ? '' : league.league_id)}
                                            >
                                                <td colSpan={4} className={'left'}>
                                                    <p>
                                                        {
                                                            avatar(league.avatar, league.name, 'league')
                                                        }
                                                        {league.name}
                                                    </p>
                                                </td>
                                                <td colSpan={2}>
                                                    {
                                                        league.empty_slots
                                                    }
                                                </td>
                                                <td colSpan={2}>
                                                    {
                                                        league.so_slots
                                                    }
                                                </td>
                                            </tr>
                                            {
                                                rostersVisible !== league.league_id ? null :
                                                    <tr>
                                                        <td colSpan={8}>
                                                            <div className={`nav2`}></div>
                                                            <React.Suspense fallback={
                                                                <div className='logo_wrapper'>
                                                                    <div className='z one'>Z</div>
                                                                    <div className='z two'>Z</div>
                                                                    <div className='z three'>Z</div>
                                                                </div>}>
                                                                <LineupBreakdown
                                                                    type={2}
                                                                    roster={league.userRoster}
                                                                    lineup_check={getLineupCheck(league.roster_positions, league.userRoster, weekly_rankings, allplayers)}
                                                                    avatar={avatar}
                                                                    weekly_rankings={weekly_rankings}
                                                                    allplayers={allplayers}
                                                                />
                                                            </React.Suspense>
                                                        </td>
                                                    </tr>
                                            }
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    )
            }
            {
                (((page - 1) * 25) + 25) < leagues_display.length ?
                    <tbody>
                        <tr
                            className={'clickable'}
                            onClick={() => setPage(prevState => prevState + 1)}
                        >
                            <td colSpan={8}>NEXT PAGE</td>
                        </tr>
                    </tbody>
                    :
                    null
            }
        </>
    )

    const header = lineupCheck ? header_lineup_check : header_standings
    const display = lineupCheck ? display_lineup_check : display_standings

    return <>
        <button
            className={lineupCheck ? 'active clickable' : 'clickable'}
            onClick={() => setLineupCheck(prevState => !prevState)}
        >
            Lineup Check
        </button>
        <React.Suspense fallback={<>...</>}>
            <Search
                list={leagues.map(league => league.name)}
                placeholder={'Search Leagues'}
                sendSearched={(data) => setSearched(data)}
            />
        </React.Suspense>
        <div className="page_numbers_wrapper">
            <ol className="page_numbers">
                {Array.from(Array(Math.ceil(leagues_display.length / 25)).keys()).map(key => key + 1).map(page_number =>
                    <li className={page === page_number ? 'active clickable' : 'clickable'} key={page_number} onClick={() => setPage(page_number)}>
                        {page_number}
                    </li>
                )}
            </ol>
        </div>
        <table className="main">
            <thead className="main">
                {header}
            </thead>
            {display}
        </table>
    </>
}

export default React.memo(Leagues);