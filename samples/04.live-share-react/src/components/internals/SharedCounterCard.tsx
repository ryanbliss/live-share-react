import { FC } from "react";
import { useSharedState } from "@microsoft/live-share-react";

export interface ICard {
  id: string;
  title: string;
}

export interface ISharedCounterCardProps {
  card: ICard;
  onDelete: (id: string) => void;
}

export const SharedCounterCard: FC<ISharedCounterCardProps> = ({
  card,
  onDelete,
}) => {
  const [count, setCount, disposeCount] = useSharedState(
    `card-count:${card.id}`,
    0
  );
  return (
    <div className="card">
      <h3>{card.title}</h3>
      <p>{card.id}</p>
      <div className="flex row vAlign" style={{ marginBottom: "12px" }}>
        <button
          style={{ marginRight: "12px" }}
          onClick={() => {
            setCount(count + 1);
          }}
        >
          {"+1"}
        </button>
        <span
          style={{ fontWeight: 600, fontSize: "1.4em", lineHeight: "1.1" }}
        >{`${count} `}</span>
      </div>
      <button
        onClick={() => {
          onDelete(card.id);
          disposeCount();
        }}
      >
        {"Delete"}
      </button>
    </div>
  );
};
