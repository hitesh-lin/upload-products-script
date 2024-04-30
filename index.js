const csv = require('csvtojson');
const { convert } = require('html-to-text');

const options = {
    wordwrap: false,
};

const slugify = (str) => {
    return String(str)
        .normalize('NFKD') // split accented characters into their base characters and diacritical marks
        .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
        .trim() // trim leading or trailing whitespace
        .toLowerCase() // convert to lowercase
        .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // remove consecutive hyphens
}

const getMetadata = (obj) => {
    let metadata = [];
    Object.keys(obj).forEach((key) => {
        if (key === "Product Code" || key === "Range" || key === "Brand") {
            metadata.push({
                key: key,
                value: obj?.[key]
            })
        }
    })

    return metadata;
}

async function abc() {
    const csvFilePath = './productData.csv'
    let jsonArray = await csv().fromFile(csvFilePath);

    // jsonArray = jsonArray?.slice(0, 10);

    let prevProductCode = "";
    let prevProductID = "";
    let prevProductOptionID = ""

    for (let i = 0; i < jsonArray.length; i++) {

        const prevProductCodeSuffix = prevProductCode?.split("-")?.[2] || "";
        const currentProductCodeSuffix = jsonArray[i]?.["Product Code"]?.split("-")?.[2];

        const productTitle = jsonArray[i]?.["Name"]?.split("-")?.[0];
        const productHandle = `${slugify(productTitle)}-${jsonArray[i]?.["Product Code"]?.toLowerCase()}`;
        const productDescription = jsonArray[i]?.["Short Description"] ? convert(jsonArray[i]?.["Short Description"], options) : "";
        if (prevProductCodeSuffix === currentProductCodeSuffix) {
            //new variant in same product
            const variantPrices = [
                {
                    "amount": parseFloat(jsonArray[i]?.["Price"]) * 100,
                    "currency_code": "gbp"
                },
                {
                    "amount": parseFloat(jsonArray[i]?.["Price"]) * 100,
                    "currency_code": "usd"
                },
                {
                    "amount": parseFloat(jsonArray[i]?.["Price"]) * 100,
                    "currency_code": "eur"
                }
            ];
            const variantName = jsonArray[i]?.["Name"]?.split("-")?.[1];
            const body = {
                "title": variantName,
                "material": null,
                "mid_code": null,
                "hs_code": null,
                "origin_country": null,
                "sku": null,
                "ean": null,
                "upc": null,
                "barcode": null,
                "inventory_quantity": 100,
                "manage_inventory": false,
                "allow_backorder": false,
                "weight": null,
                "width": null,
                "height": null,
                "length": null,
                "prices": variantPrices,
                "metadata": {},
                "options": [
                    {
                        "option_id": prevProductOptionID,
                        "value": variantName
                    }
                ]
            }


            const res = await fetch(`http://localhost:9000/admin/products/${prevProductID}/variants`, {
                "headers": {
                    "accept": "application/json",
                    "accept-language": "en-US,en;q=0.9",
                    "content-type": "application/json",
                    "idempotency-key": "0db85a40-75dd-4fa9-803a-117bb03a5002",
                    "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "cookie": "__stripe_mid=69b45612-ba0a-415b-8556-c3a51872a18d344a63; connect.sid=s%3ANavuHDkOLpjUf2Pr_f8_qfjcIbDVD9gC.iLa7Y9tE9tsZrVXGgl%2FOMMd0ZhcJ3ArNemqYLgsBu3E; ajs_user_id=usr_01HWQMHRKQPTTR8P91WMFTM36N; ajs_anonymous_id=fc19007d-93cc-48a2-b811-43c2802f1925",
                    "Referer": "http://localhost:7001/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "body": JSON.stringify(body),
                "method": "POST"
            });

            const data = await res.json();
            if(!data?.product){
                console.log("variant data",data)
            }

        } else {
            const variantPrices = [
                {
                    "amount": parseFloat(jsonArray[i]?.["Price"]) * 100,
                    "currency_code": "gbp"
                },
                {
                    "amount": parseFloat(jsonArray[i]?.["Price"]) * 100,
                    "currency_code": "usd"
                },
                {
                    "amount": parseFloat(jsonArray[i]?.["Price"]) * 100,
                    "currency_code": "eur"
                }
            ];
            const variantObj = [
                {
                    "title": jsonArray[i]?.["Name"]?.split("-")?.[1],
                    "inventory_quantity": 100,
                    "prices": variantPrices,
                    "allow_backorder": false,
                    "options": [
                        {
                            "value": jsonArray[i]?.["Name"]?.split("-")?.[1]
                        }
                    ],
                    "manage_inventory": true
                }
            ];
            const defaultVariantObject = [
                {
                    "title": "Default",
                    "inventory_quantity": 100,
                    "prices": variantPrices,
                    "allow_backorder": false,
                    "options": [
                        {
                            "value": "Default"
                        }
                    ],
                    "manage_inventory": true
                }
            ]
            //new product
            const body = {
                "title": productTitle,
                "handle": productHandle,
                "discountable": true,
                "is_giftcard": false,
                "description": productDescription,
                "options": [
                    {
                        "title": "Finish"
                    }
                ],
                "variants": jsonArray[i]?.["Name"]?.split("-")?.[1] ? variantObj : defaultVariantObject,
                "status": "published",
                "sales_channels": [
                    {
                        "id": "sc_01HWQMDWNYXNPFBYW355Z2XNXQ"
                    }
                ]
            }
            const res = await fetch("http://localhost:9000/admin/products/", {
                "headers": {
                    "content-type": "application/json",
                    "cookie": "__stripe_mid=69b45612-ba0a-415b-8556-c3a51872a18d344a63; connect.sid=s%3ANavuHDkOLpjUf2Pr_f8_qfjcIbDVD9gC.iLa7Y9tE9tsZrVXGgl%2FOMMd0ZhcJ3ArNemqYLgsBu3E; ajs_user_id=usr_01HWQMHRKQPTTR8P91WMFTM36N; ajs_anonymous_id=fc19007d-93cc-48a2-b811-43c2802f1925",
                },
                "body": JSON.stringify(body),
                "method": "POST"
            });
            const data = await res.json();
            if(!data?.product){
                console.log("data", data)
            }
            const productID = data?.product?.id;
            prevProductID = productID;
            const optionsID = data?.product?.options?.[0]?.id;
            prevProductOptionID = optionsID;

            //update metadata
            const productMetadata = {
                "attribute": JSON.stringify(getMetadata(jsonArray[i]))
            };

            const productMetadataBody = {
                "title": productTitle,
                "handle": productHandle,
                "material": null,
                "subtitle": null,
                "description": productDescription,
                "type": null,
                "collection_id": null,
                "tags": [],
                "categories": [],
                "discountable": true,
                "metadata": productMetadata
            }

            await fetch(`http://localhost:9000/admin/products/${productID}`, {
                "headers": {
                    "content-type": "application/json",
                    "cookie": "__stripe_mid=69b45612-ba0a-415b-8556-c3a51872a18d344a63; connect.sid=s%3ANavuHDkOLpjUf2Pr_f8_qfjcIbDVD9gC.iLa7Y9tE9tsZrVXGgl%2FOMMd0ZhcJ3ArNemqYLgsBu3E; ajs_user_id=usr_01HWQMHRKQPTTR8P91WMFTM36N; ajs_anonymous_id=fc19007d-93cc-48a2-b811-43c2802f1925",
                },
                "body": JSON.stringify(productMetadataBody),
                "method": "POST"
            });

        }

        prevProductCode = jsonArray[i]?.["Product Code"];
    }
}
abc();



