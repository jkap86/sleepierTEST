

import React from "react";
import { avatar } from "../misc_functions";
const PlayerStartBench = React.lazy(() => import('./playerStartBench'))

const PlayersRankProj = ({ playershares_display, playershares, page, setPage, leaguesVisible, setLeaguesVisible, rowRef, user_id, allplayers, weekly_rankings }) => {

    const header = (
        <>
            <tr className="main_header double">
                <th colSpan={3} rowSpan={2}>Player</th>
                <th colSpan={4}>Rank</th>
                <th colSpan={2} rowSpan={2}>Opp</th>
                <th colSpan={1} rowSpan={2}>Start</th>
                <th colSpan={1} rowSpan={2}>Bench</th>
            </tr>
            <tr className="main_header double">
                <th colSpan={1}>OVR</th>
                <th colSpan={1}>Min</th>
                <th colSpan={1}>Max</th>
                <th colSpan={1}>Pos</th>
            </tr>
        </>
    )

    const display = (
        <>
            {
                playershares_display
                    .slice((page - 1) * 25, ((page - 1) * 25) + 25).map((player, index) =>
                        <tbody
                            key={`${player.id}_${index}`}
                            className={leaguesVisible === player.id ? 'active' : null}
                        >
                            <tr>
                                <td colSpan={11}>
                                    <table className={`table${1}`}>
                                        <tbody>
                                            <tr
                                                ref={index === 0 ? rowRef : null}
                                                className={leaguesVisible === player.id ? 'main_row active clickable' : 'main_row clickable'}
                                                onClick={() => setLeaguesVisible(prevState => prevState === player.id ? '' : player.id)}
                                            >
                                                <td colSpan={3} className={'left'}>
                                                    <p>
                                                        {
                                                            avatar(player.id, allplayers[player.id]?.full_name, 'player')
                                                        }
                                                        {allplayers[player.id]?.position}&nbsp;
                                                        {allplayers[player.id]?.full_name || player.player_name}&nbsp;
                                                        {allplayers[player.id]?.team}
                                                    </p>
                                                </td>
                                                <td colSpan={1}>{player.rank_ecr}</td>
                                                <td colSpan={1}>{player.rank_min}</td>
                                                <td colSpan={1}>{player.rank_max}</td>
                                                <td colSpan={1}>{player.pos_rank}</td>
                                                <td colSpan={2}>{player.player_opponent}</td>
                                                <td colSpan={1}>
                                                    {
                                                        playershares.find(ps => ps.id === player.id)?.leagues_owned.filter(lo => lo.status === 'Starter').length
                                                    }
                                                </td>
                                                <td colSpan={1}>
                                                    {
                                                        playershares.find(ps => ps.id === player.id)?.leagues_owned.filter(lo => lo.status !== 'Starter').length
                                                    }
                                                </td>
                                            </tr>
                                            {
                                                leaguesVisible !== player.id ? null :
                                                    <tr>
                                                        <td colSpan={11}>
                                                            <React.Suspense fallback={
                                                                <div className='logo_wrapper'>
                                                                    <div className='z one'>Z</div>
                                                                    <div className='z two'>Z</div>
                                                                    <div className='z three'>Z</div>
                                                                </div>}>
                                                                <PlayerStartBench
                                                                    type={2}
                                                                    player_id={player.id}
                                                                    leagues_starting={playershares.find(ps => ps.id === player.id)?.leagues_owned.filter(lo => lo.status === 'Starter')}
                                                                    leagues_benched={playershares.find(ps => ps.id === player.id)?.leagues_owned.filter(lo => lo.status !== 'Starter')}
                                                                    avatar={avatar}
                                                                    user_id={user_id}
                                                                    weekly_rankings={weekly_rankings}
                                                                    player_rank={player.rank_ecr}
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
                (((page - 1) * 25) + 25) < playershares_display.length ?
                    <tbody>
                        <tr
                            className={'clickable'}
                            onClick={() => setPage(prevState => prevState + 1)}
                        >
                            <td colSpan={11}>NEXT PAGE</td>
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
export default PlayersRankProj;