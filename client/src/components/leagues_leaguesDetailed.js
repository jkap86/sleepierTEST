import React from 'react';
const LeagueRosters = React.lazy(() => import('./leagueRosters'));

const LeaguesDetailed = ({ leagues, page, sendSort, rostersVisible, avatar, toggleRosters, user_id, allplayers }) => {

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
                    <th colSpan={3}
                        className={'clickable'}
                        onClick={() => sendSort('Record')}
                    >
                        Record
                    </th>
                    <th colSpan={4}
                        className={'clickable'}
                        onClick={() => sendSort('PF')}
                    >
                        PF - PA
                    </th>
                    <th colSpan={1}
                        className={'small clickable'}
                        onClick={() => sendSort('Rank (Ovr)')}
                    >
                        Rank (Ovr)
                    </th>
                    <th colSpan={1}
                        className={'small clickable'}
                        onClick={() => sendSort('Rank (PF)')}
                    >
                        Rank (PF)
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
                                <td colSpan={13}>
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
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            {
                                !rostersVisible.includes(league.league_id) ? null :
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
                    )
            }
        </table>
    )

    return <>
        {display}
    </>
}

export default LeaguesDetailed;