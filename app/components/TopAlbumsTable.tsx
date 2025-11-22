import type { GetTopAlbumsResult } from "@/actions/lastfm";

export interface TopAlbumsTableProps {
  result: GetTopAlbumsResult;
}

export const TopAlbumsTable = ({ result }: TopAlbumsTableProps) => {
  if (result.status === "error") {
    return <p>Top albums are temporarily unavailable :(</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Album</th>
          <th>Artist</th>
          <th>Plays</th>
        </tr>
      </thead>
      <tbody>
        {result.albums.map((album) => (
          <tr key={`${album.rank}-${album.name}`}>
            <td>{album.rank}</td>
            <td>{album.name}</td>
            <td>{album.artist}</td>
            <td>{album.playcount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
