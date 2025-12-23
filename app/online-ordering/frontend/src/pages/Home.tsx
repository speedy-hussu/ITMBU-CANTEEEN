import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchItems } from "@/api/api";
import ItemCard from "@/components/STUDENT/item-card";
import type { MenuItem } from "@shared/types/item.types";

// Sample data will be replaced by the API response

const categories = ["All", "Dish", "Product"];

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: menuItems = [],
    isLoading,
    error,
  } = useQuery<MenuItem[]>({
    queryKey: ["items"], // cache key
    queryFn: fetchItems, // API function
    staleTime: 5 * 60 * 1000, // 5 minutes (prevents re-fetch spam)
    retry: 1, // retry failed requests once
  });
  const filteredItems = menuItems.filter((item: MenuItem) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pb-20 min-h-[calc(100dvh-65px)] bg-gradient-primary ">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm ">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Canteen
            </h1>
          </div>
          {isLoading && <div>Loading...</div>}
          {error && <div>Error: {error.message}</div>}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 rounded-lg"
            />
          </div>
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap text-xs sm:text-sm ${
                  selectedCategory === cat && "btn-gradient-primary text-white"
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="p-4 overflow-y-auto scrollbar-none ">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 ">
          {filteredItems.map((item: MenuItem) => (
            <ItemCard key={item._id || item.name} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
