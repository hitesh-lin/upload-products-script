const cookie =
    "__stripe_mid=69b45612-ba0a-415b-8556-c3a51872a18d344a63; ajs_user_id=usr_01HWQMHRKQPTTR8P91WMFTM36N; ajs_anonymous_id=fc19007d-93cc-48a2-b811-43c2802f1925; connect.sid=s%3AsWmcABZ0vpWySCsnbWRC6gdFulFAfgbv.qGVcGs5Jw4xmZA2RDKaH0uyBiJetvht2%2BailJm6VZEs";
const collection_id = "pcol_01HWX8SYQQBJK33X4C97QH8R9Z"


async function handleFileUpload() {

    const res = await fetch(`http://localhost:9000/admin/collections/${collection_id}`, {
        headers: {
            "content-type": "application/json",
            cookie: cookie,
        },
        method: "GET"
    })
    const data = await res.json()
    console.log(data)
    if (data?.collection.products) {
        data?.collection?.products?.forEach(async (item) => {
            try {
                const response = await fetch(`http://localhost:9000/admin/products/${item.id}`, {
                    headers: {
                        "content-type": "application/json",
                        cookie: cookie,
                    },
                    method: "DELETE",
                });
                // Handle response if needed
            } catch (error) {
                console.error("Error occurred while fetching:", error);
                // Handle error if needed
            }
        });
    }
};

handleFileUpload()