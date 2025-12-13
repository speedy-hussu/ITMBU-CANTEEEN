import { Checkbox } from "@/components/ui/checkbox";

interface CardItemProps {
  name: string;
  qty: number;
  checked: boolean;
  onCheck: () => void;
  disabled?: boolean;
}

export default function CardItem({
  name,
  qty,
  checked,
  onCheck,
  disabled = false,
}: CardItemProps) {
  return (
    <div className="w-full flex justify-between items-center text-lg mb-0.5 p-1 rounded font-semibold">
      <div className="flex items-center gap-2">
        {!disabled && (
          <Checkbox
            checked={checked}
            onCheckedChange={onCheck}
            className="cursor-pointer"
          />
        )}
        <p className={checked ? "text-gray-500" : ""}>{name}</p>
      </div>
      <p>x{qty}</p>
    </div>
  );
}
