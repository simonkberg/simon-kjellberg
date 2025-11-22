import type { GetTopTracksResult } from "@/actions/lastfm";

export interface TopTracksTableProps {
  result: GetTopTracksResult;
}

export const TopTracksTable = ({ result }: TopTracksTableProps) => {
  if (result.status === "error") {
    return <p>Top tracks are temporarily unavailable :(</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Track</th>
          <th>Artist</th>
          <th>Plays</th>
        </tr>
      </thead>
      <tbody>
        {result.tracks.map((track) => (
          <tr key={`${track.rank}-${track.name}`}>
            <td>{track.rank}</td>
            <td>{track.name}</td>
            <td>{track.artist}</td>
            <td>{track.playcount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
