import { ActionPanel, Action, List } from "@raycast/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

const digitPattern = /^\d+$/;

interface Term {
  id: string;
  name: string;
  aliases: string[];
}

interface SearchResult {
  id: string;
  name: string;
}

export function Common({ type }: { type: string }) {
  const { result, search, query } = useSearch(type);

  return (
    <List onSearchTextChange={search} searchBarPlaceholder="Input ID or name...">
      <List.Section title="Results">
        {result.map((searchResult) => (
          <SearchListItem key={searchResult.name} searchResult={searchResult} isDigit={query.isDigit} />
        ))}
      </List.Section>
    </List>
  );
}

function SearchListItem({ searchResult, isDigit }: { searchResult: SearchResult; isDigit: boolean }) {
  return (
    <List.Item
      title={searchResult.name}
      subtitle={searchResult.id}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title={isDigit ? "Copy Name" : "Copy ID"}
              content={isDigit ? searchResult.name : searchResult.id}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function useSearch(type: string) {
  const [csv, setCSV] = useState<Term[]>([]);
  const [query, setQuery] = useState({
    text: "",
    isDigit: false,
  });

  const search = useCallback((query: string) => {
    const text = query.trim();
    const isDigit = !!digitPattern.exec(query);
    setQuery({ text, isDigit });
  }, []);

  useEffect(() => {
    (async () => {
      const data = await readFile(path.join(__dirname, `assets/${type}.csv`), "utf-8");
      setCSV(
        data
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => !!line)
          .map((line) => {
            const [id, name, ...aliases] = line.split(",");
            return { id, name, aliases };
          })
      );
    })();
  }, []);

  const result = useMemo(() => {
    if (query.text) {
      if (query.isDigit) {
        return csv.filter((row) => row.id.startsWith(query.text));
      } else {
        return csv.filter((row) => row.name.includes(query.text) || row.aliases.some((a) => a.includes(query.text)));
      }
    } else {
      return csv;
    }
  }, [query, csv]);

  return {
    search,
    result,
    query,
  };
}
