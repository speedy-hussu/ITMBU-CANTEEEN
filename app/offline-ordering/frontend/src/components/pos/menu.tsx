import { useEffect, useState } from "react";
import ItemCard from "./item-card";
import { Search, X } from "lucide-react";

import api from "@/api/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { BaseItem } from "@shared/types/item.types";
type CategoryType = "All" | "Product" | "Dish";

function Menu() {
  const [category, setCategory] = useState<CategoryType>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [menuItems, setMenuItems] = useState<BaseItem[]>([]);

  // ✅ MongoDB se items fetch
    useEffect(() => {
      const fetchItems = async () => {
        try {
          const res = await api.get<BaseItem[]>("/items/getItems");
          setMenuItems(res.data);
        } catch (err) {
          console.error("Error fetching items:", err);
          toast.error("Failed to fetch menu items");
        }
      };
      fetchItems();
    }, []);


  const categories: CategoryType[] = ["All", "Product", "Dish"];

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <div>
        <h1 className="px-5 text-3xl font-bold my-2 text-white">ITMBU MENU</h1>

        {/* ✅ Category buttons + Search bar */}
        <div className="px-5 flex flex-wrap items-center gap-2">
          {/* Category Badges */}
          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={category === cat ? "default" : "secondary"}
                className={`cursor-pointer text-sm px-4 py-2 transition-all ${
                  category === cat
                    ? "bg-white text-[#667eea] hover:bg-white/90"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
                onClick={() => {
                  setCategory(cat);
                  setSearchTerm("");
                }}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute text-white/70 z-10 top-1/2 left-3 transform -translate-y-1/2 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search Item"
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCategory("All");
              }}
              className="w-40 pl-9 pr-9 text-white placeholder:text-white/50 rounded-lg bg-white/20 border-2 border-transparent
             outline-none focus:border-white "
              value={searchTerm}
            />
            {searchTerm !== "" && (
              <X
                className="text-white absolute z-10 top-1/2 right-10 transform -translate-y-1/2 cursor-pointer hover:text-white/70 h-4 w-4"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>

         
        </div>
      </div>

      {/* ✅ Items List */}
      <div
        className="overflow-y-auto p-5 mt-2 md:h-[calc(100dvh-100px)] h-[calc(100dvh-175px)]   
        [&::-webkit-scrollbar]:w-2 
          [&::-webkit-scrollbar-thumb]:bg-white/40 
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:hover:bg-white/60"
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
          {menuItems.filter((item) => {
            return category === "All" ? true : item.category === category;
          })
            .filter((item) => {
              return item.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .map((item) => (
              <ItemCard
                key={item._id}
                item={item}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

export default Menu;
