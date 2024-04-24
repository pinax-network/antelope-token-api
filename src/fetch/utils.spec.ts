import { expect, test } from "bun:test";
import { addMetadata } from "./utils.js";
import { Query } from "../clickhouse/makeQuery.js";

test("addMetadata pagination", () => {
    const limit = 5;
    const mock_query_reponse: Query<any> = {
        meta: [],
        data: Array(limit),
        rows: limit,
        rows_before_limit_at_least: 5*limit, // Simulate query with more total results than the query limit making pagination relevant
        statistics: {
            elapsed: 0,
            rows_read: 0,
            bytes_read: 0,
        }
    };

    const first_page = addMetadata(mock_query_reponse, limit, 1);
    expect(first_page.meta.next_page).toBe(2);
    expect(first_page.meta.previous_page).toBe(1); // Previous page should be set to 1 on first page
    expect(first_page.meta.total_pages).toBe(5);
    expect(first_page.meta.total_results).toBe(5*limit);

    const odd_page = addMetadata(mock_query_reponse, limit, 3);
    expect(odd_page.meta.next_page).toBe(4);
    expect(odd_page.meta.previous_page).toBe(2);
    expect(odd_page.meta.total_pages).toBe(5);
    expect(odd_page.meta.total_results).toBe(5*limit);

    const even_page = addMetadata(mock_query_reponse, limit, 4);
    expect(even_page.meta.next_page).toBe(5);
    expect(even_page.meta.previous_page).toBe(3);
    expect(even_page.meta.total_pages).toBe(5);
    expect(even_page.meta.total_results).toBe(5*limit);

    const last_page = addMetadata(mock_query_reponse, limit, 5);
    expect(last_page.meta.next_page).toBe(last_page.meta.total_pages); // Next page should be capped to total_pages on last page
    expect(last_page.meta.previous_page).toBe(4);
    expect(last_page.meta.total_pages).toBe(5);
    expect(last_page.meta.total_results).toBe(5*limit);

    // TODO: Expect error message on beyond last page
    // const beyond_last_page = addMetadata(mock_query_reponse.data, mock_query_reponse.rows_before_limit_at_least, limit, 6);
});