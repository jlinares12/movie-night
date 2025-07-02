import axios from 'axios';
import {useState, useEffect} from 'react'

export default function Techstack() {
  const [data, setData] = useState({"tech" : []});
  const fetchAPI = async () => {
    const response = await axios.get("api/data");
    console.log(response.data);
    setData(response.data)
  };

  useEffect(() => {
    fetchAPI()
  }, [])

  return (
    <div>
      <h1>Movie Night</h1>
      <h3>This project is going to use the following tech stack:</h3>
      {(typeof data.tech === 'undefined') ? (
        <p>Loading</p>
      ): (
        data.tech.map((tech, i) => (
          <p key={i}>{tech}</p>
        ))
      )
      }
    </div>
  )
}
