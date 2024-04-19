export function toJSON(data: any, status: number = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export function addMetadata(data: any[], total_before_limit: number, limit: number, page: number) {
    // TODO: Catch page number greater than total_pages and return error
    return {
        data,
        meta: {
            "next_page": (page * limit >= total_before_limit) ? page : page + 1,
            "previous_page": (page <= 1) ? page : page - 1,
            "total_pages": Math.ceil(total_before_limit / limit),
            "total_results": total_before_limit
        }
    }
}