import { useState } from "react";
import Link from "next/link";

interface AutoCompleteItem {
  name: string;
  pathname: string;
}

interface AutoCompleteProps {
  data: AutoCompleteItem[];
}

const AutoComplete = ({ data }: AutoCompleteProps) => {
  const [suggestions, setSuggestions] = useState<AutoCompleteItem[]>([]);
  const [suggestionsActive, setSuggestionsActive] = useState(false);
  const [value, setValue] = useState("");

  const handleChange = (e: { target: { value: string } }) => {
    const query = e.target.value.toLowerCase();
    setValue(query);
    if (query.length > 1) {
      const filterSuggestions = data.filter(
        (suggestion) => suggestion.name.toLowerCase().indexOf(query) > -1
      );
      setSuggestions(filterSuggestions);
      setSuggestionsActive(true);
    } else {
      setSuggestionsActive(false);
    }
  };

  const Suggestions = () => {
    return (
      <ul className="max-w-xs flex flex-col fixed">
        {suggestions.map((suggestion, index) => {
          return (
            <Link
              href={{
                pathname: "/" + suggestion.pathname,
                query: { name: suggestion.name },
              }}
              key={`${suggestion.name}-${index}`}
            >
              <li
                className=" cursor-pointer inline-flex items-center gap-x-2 py-3 px-4 text-sm font-medium bg-white border text-gray-800 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                {suggestion.name}
              </li>
            </Link>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="autocomplete">
      <input
        type="text"
        value={value}
        className="py-2 px-4 pl-11 block w-full border-gray-200 shadow-sm rounded-md text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500  dark:border-gray-700 dark:text-gray-400"
        onChange={handleChange}
        placeholder="Search"
      />
      {suggestionsActive && <Suggestions />}
    </div>
  );
};

export default AutoComplete;

