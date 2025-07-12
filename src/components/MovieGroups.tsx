import { useState, useEffect } from "react";
import axios from "axios";
import GroupLink from "./GroupLink";
import GroupLinkSkeleton from "./skeletons/GroupLinkSkeleton";

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
            <div className="w-full justify-self-start">
                {(data.length === 0) ? (
                    <div className="divide-y divide-[var(--primary-gray)]">
                        <GroupLinkSkeleton/>
                        <GroupLinkSkeleton/>
                    </div>
                ): (
                <ul className="list-none divide-y divide-[var(--primary-gray)]">
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