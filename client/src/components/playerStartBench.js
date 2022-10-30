import React, { useEffect, useState } from "react";
import { avatar } from "./misc_functions";

const PlayerStartBench = (props) => {
    const [leaguesStarting, setLeaguesStarting] = useState([])
    const [leaguesBenched, setLeaguesBenched] = useState([])
    const [tab, setTab] = useState('Owned')
    const [rostersVisible, setRostersVisible] = useState([]);
    const [page, setPage] = useState(1);

    const toggleRosters = (league_id) => {
        let rv = rostersVisible;
        if (rv.includes(league_id)) {
            rv = rv.filter(x => x !== league_id)
        } else {
            rv.push(league_id)
        }
        setRostersVisible([...rv])
    }

    useEffect(() => {
        setLeaguesStarting(props.leagues_starting)
        setLeaguesBenched(props.leagues_benched)
    }, [props.leagues_starting, props.leagues_benched])



    return <>
        <div className={`nav${props.type}`}>

        </div>
        <table className={`table${props.type} lineup`}>
            <thead>
                <tr className={'single'}>
                    <th colSpan={3}>Starting</th>
                    <th colSpan={1}>Rank OVR</th>
                    <th colSpan={1}>Rank PF</th>
                </tr>
            </thead>
            {
                leaguesStarting.map((ls, index) =>
                    <tbody key={`${ls.league_id}_${index}`}>
                        <tr>
                            <td colSpan={3} className={'left'}>
                                <p>
                                    {
                                        avatar(ls.league_avatar, ls.league_name, 'league')
                                    }
                                    {ls.league_name}
                                </p>
                            </td>
                            <td>
                                {ls.rank}
                            </td>
                            <td>
                                {ls.rank_pts}
                            </td>
                        </tr>
                    </tbody>
                )
            }
        </table>
        <table className={`table${props.type} subs`}>
            <thead>
                <tr className={'single'}>
                    <th colSpan={3}>Benched</th>
                    <th colSpan={1}>Rank OVR</th>
                    <th colSpan={1}>Rank PF</th>
                </tr>
            </thead>
            {
                leaguesBenched.map((ls, index) =>
                    <tbody key={`${ls.league_id}_${index}`}>
                        <tr>
                            <td colSpan={3} className={'left'}>
                                <p>
                                    {
                                        avatar(ls.league_avatar, ls.league_name, 'league')
                                    }
                                    {ls.league_name}
                                </p>
                            </td>
                            <td>
                                {ls.rank}
                            </td>
                            <td>
                                {ls.rank_pts}
                            </td>
                        </tr>
                    </tbody>
                )
            }
        </table>

    </>
}

export default React.memo(PlayerStartBench);