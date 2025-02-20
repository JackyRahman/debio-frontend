import apiClientRequest from "@/lib/api"

export const getOrdersData = async (hash, page, size, keyword = "") => {
  const { data } = await apiClientRequest.get(`substrate/orders/list/lab/${hash}`, {
      params: {
        keyword,
        size,
        page
      }
    }
  )

  return data
}
