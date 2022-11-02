import React, { useState } from 'react';
import { avatar } from "../misc_functions";
import { getLineupCheck } from '../projections_stats';
import throttle from 'lodash.throttle';
const LineupBreakdown = React.lazy(() => import('./lineupBreakdown'));

const LeaguesLineupCheck = ({ sortLeagues, leagues_display, page, setPage, rowRef, rostersVisible, setRostersVisible, weekly_rankings, allplayers, syncLeague, user_id }) => {
    const [syncing, setSyncing] = useState(false)

    const handleSyncLeague = (league_id, user_id) => {
        setSyncing(true)
        syncLeague(league_id, user_id)
        setTimeout(() => {
            setSyncing(false)
        }, 5000)
    }

    const header = (
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


    const display = (
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
                                                            <div className={`nav2`}>
                                                                {
                                                                    syncing ? null :
                                                                        <button
                                                                            className={'clickable'}
                                                                            onClick={() => handleSyncLeague(league.league_id, user_id)}
                                                                        >
                                                                            Sync League
                                                                        </button>
                                                                }
                                                            </div>
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

    return <>
        <table className="main">
            <thead className="main">
                {header}
            </thead>
            {display}
        </table>
    </>
}
export default LeaguesLineupCheck;