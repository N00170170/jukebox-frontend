import '../App.css';

import { useEffect } from "react";

const SpotifyCallback = (props) => {
    useEffect(() => {
        const query = new URLSearchParams(props.location.search);
        const code = query.get('code')

        localStorage.setItem("spotify_auth_code", code)

        window.opener = null;
        window.open("", "_self");
        window.close();
    }, []);

    return null;
};

export default SpotifyCallback;
