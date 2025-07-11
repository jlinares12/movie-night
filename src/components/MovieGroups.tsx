import { useState, useEffect } from "react";
import axios from "axios";

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
                <ul className="list-decimal">
                    {data.map((group, i) => (
                    <li key={i} className="">
                        {group["name"]}
                    </li>
                    ))}
                </ul>
                )}
            </div>
        </div>
    )
}