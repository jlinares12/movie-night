import { useState, useEffect } from "react";
import axios from "axios";
import GroupLink from "./GroupLink";

export default function MovieGroups() {
    const [data, setData] = useState([])
    const fetchAPI = async () => {
    const response = await axios.get("api/groups");
    setData(response.data);
  }

  useEffect(() => {
    fetchAPI();
  },[])

    return (
        <div className="flex flex-col items-center justify-center">
            <div>
                <h1>Your Groups</h1>
            </div>
            <div className="w-full justify-self-start">
                {(typeof data === 'undefined') ? (
                <p>Loading</p>
                ): (
                <ul className="list-none divide-y divide-[var(--primary-opacity)]">
                    {data.map((group, i) => (
                        <GroupLink
                            key={i}
                            name={group["name"]}
                            user_count={group["user_count"] as number}
                            date={group["date"]}/>
                    ))}
                </ul>
                )}
            </div>
        </div>
    )
}