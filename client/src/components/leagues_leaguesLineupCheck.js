import React from 'react';
import { getLineupCheck } from './projections_stats';
const LineupBreakdown = React.lazy(() => import('./lineupBreakdown'));

const LeaguesLineupCheck = ({ leagues, page, sendSort, rostersVisible, avatar, toggleRosters, weekly_rankings, allplayers }) => {

    const display = (
        <table className={'main'}>
            <thead className={'main'}>
                <tr className="main_header single">
                    <th colSpan={4}
                        className={'clickable'}
                        onClick={() => sendSort('League')}
                    >
                        League
                    </th>
                    <th colSpan={2}>
                        Empty Starter Slots
                    </th>
                    <th colSpan={2}>
                        Suboptimal Slots
                    </th>
                </tr>
            </thead>
            {
                leagues
                    .slice((page - 1) * 25, ((page - 1) * 25) + 25)
                    .map((league, index) =>
                        <tbody
                            key={`${league.league_id}_${index}`}
                            className={rostersVisible.includes(league.league_id) ? 'active' : null}
                        >
                            <tr>
                                <td colSpan={8}>
                                    <table className={`table${1}`}>
                                        <tbody>
                                            <tr
                                                className={rostersVisible.includes(league.league_id) ? 'main_row active clickable' : 'main_row clickable'}
                                                onClick={() => toggleRosters(league.league_id)}
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
                                                        league.userRoster.starters.filter(s => s === '0').length
                                                    }
                                                </td>
                                                <td colSpan={2}>
                                                    {
                                                        getLineupCheck(league.roster_positions, league.userRoster, weekly_rankings, allplayers)
                                                            .filter(slot => slot.subs.length > 0).length
                                                    }
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            {
                                !rostersVisible.includes(league.league_id) ? null :
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
                    )
            }
        </table>
    )


    return <>
        {display}
    </>
}

export default LeaguesLineupCheck;