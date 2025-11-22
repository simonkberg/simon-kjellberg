import type { GetTopArtistsResult } from "@/actions/lastfm";

export interface TopArtistsTableProps {
  result: GetTopArtistsResult;
}

export const TopArtistsTable = ({ result }: TopArtistsTableProps) => {
  if (result.status === "error") {
    return <p>Top artists are temporarily unavailable :(</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Artist</th>
          <th>Plays</th>
        </tr>
      </thead>
      <tbody>
        {result.artists.map((artist) => (
          <tr key={`${artist.rank}-${artist.name}`}>
            <td>{artist.rank}</td>
            <td>{artist.name}</td>
            <td>{artist.playcount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
