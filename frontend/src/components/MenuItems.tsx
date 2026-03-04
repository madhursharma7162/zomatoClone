import type {IMenuItem} from "../types";
import { useState, useEffect } from "react";

interface MenuItemsProps{
  items: IMenuItem[];
  onItemDeleted: ()=>void;
  isSeller: boolean;
}


const MenuItems = ({items, onItemDeleted, isSeller}: MenuItemsProps) => {

  const [loadingItemId, setLoadingItemId] = useState<String | null>(null)
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3
  lg:grid-cols-4">{
    items.map((item) => {
      const isLoading = loadingItemId === item._id;
      return (
        <div className={`relative flex gap-4 rounded-lg bg-white p-4 shadow-sm transition ${
          !item.isAvailable ? "opacity-70" : ""
        }`}>

          <div className="relative shrink-0">
            <img 
              src={item.image} 
              alt=""
              className={`h-20 w-20 rounded object-cover ${
                !item.isAvailable ? "grayscale brightness-75" : ""
              }`} />

              {
                !item.isAvailable && (
                  <span className="absolute inset-0 flex items-center rounded bg-black/60 text-xs font-semibold text-white">
                    Not Available
                  </span>
                )
              }
          </div>
          <div className="flex flex-1 flex-col jsutify-between">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              {
                item.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                )
              }
            </div>
          </div>
        </div>
      )
    })
  }
  </div>;
  
}

export default MenuItems;
