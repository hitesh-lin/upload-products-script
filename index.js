const csv = require('csvtojson');
const { convert } = require('html-to-text');
const cloudinary = require('cloudinary');

cloudinary.v2.config({
    cloud_name: 'disfbqrv5',
    api_key: '159248614235452',
    api_secret: 'PxpElsNYhH0jm2OrW_3qc1SJcEw',
    secure: true,
});

const cloudinaryFolder = "../../jaquaruk-e6611f194465/jaquaruk-e6611f194465/accessories";
const csvFilePath = '../../jaquaruk-e6611f194465/jaquaruk-e6611f194465/accessories/productData.csv'

const options = {
    wordwrap: false,
};

const cookie = "__stripe_mid=69b45612-ba0a-415b-8556-c3a51872a18d344a63; ajs_user_id=usr_01HWQMHRKQPTTR8P91WMFTM36N; ajs_anonymous_id=fc19007d-93cc-48a2-b811-43c2802f1925; connect.sid=s%3Ay3HcmHPb7MUasEh6WLelzK9ljYHgF7AO.%2FjDzC5Gf8gyThbK9r01bcvAZZura6qkDic%2Ffzhi47PI";

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
                    "content-type": "application/json",
                    "cookie": cookie,
                },
                "body": JSON.stringify(body),
                "method": "POST"
            });

            const data = await res.json();
            if (!data?.product) {
                console.log("variant data", data)
            }

            //Upload Product Images (For variant) 
            const mainImage = jsonArray[i]?.["product image"];
            let mainImageHosted = "";
            if (mainImage) {
                try {
                    const res = await cloudinary.v2.uploader
                        .upload(`${cloudinaryFolder}/${mainImage}`, {
                            folder: '',
                            resource_type: 'image',
                            use_filename: true,
                            unique_filename: false,
                        });
                    const imageUrl = res.secure_url;
                    mainImageHosted = imageUrl;
                } catch (err) {
                    console.log(mainImage, "1 image upload to cloudinary error", err)
                }
            }


            const technicalImage = jsonArray[i]?.["Product Technical Image"];
            let technicalImageHosted = "";

            if (technicalImage) {
                try {
                    const res = await cloudinary.v2.uploader
                        .upload(`${cloudinaryFolder}/${technicalImage}`, {
                            folder: '',
                            resource_type: 'image',
                            use_filename: true,
                            unique_filename: false,
                        });
                    const imageUrl = res.secure_url;
                    technicalImageHosted = imageUrl;
                } catch (err) {
                    console.log(technicalImage, "2 image upload to cloudinary error", err)
                }
            }



            const hostedImages = technicalImageHosted ? [mainImageHosted, technicalImageHosted] : mainImageHosted ? [mainImageHosted] : undefined;


            const productRes = await fetch(`http://localhost:9000/admin/products/${prevProductID}`, {
                "headers": {
                    "cookie": cookie,
                },
                "method": "GET"
            });
            const productData = await productRes.json();

            const productImageURLs = productData?.product?.images?.map((img)=>img.url);

            const allProductImages = hostedImages ? [...productImageURLs, ...hostedImages] : [...productImageURLs];

            const uploadImageBody = {
                "images": allProductImages
            }

            await fetch(`http://localhost:9000/admin/products/${prevProductID}`, {
                "headers": {
                    "content-type": "application/json",
                    "cookie": cookie,
                },
                "body": JSON.stringify(uploadImageBody),
                "method": "POST"
            });

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
            ];

            const mainImage = jsonArray[i]?.["product image"];
            let mainImageHosted = "";
            if (mainImage) {
                try {
                    const res = await cloudinary.v2.uploader
                        .upload(`${cloudinaryFolder}/${mainImage}`, {
                            folder: '',
                            resource_type: 'image',
                            use_filename: true,
                            unique_filename: false,
                        });
                    const imageUrl = res.secure_url;
                    mainImageHosted = imageUrl;
                } catch (err) {
                    console.log(mainImage, "3 image upload to cloudinary error", err)
                }
            }


            const technicalImage = jsonArray[i]?.["Product Technical Image"];
            let technicalImageHosted = "";
            if (technicalImage) {
                try {
                    const res = await cloudinary.v2.uploader
                        .upload(`${cloudinaryFolder}/${technicalImage}`, {
                            folder: '',
                            resource_type: 'image',
                            use_filename: true,
                            unique_filename: false,
                        });
                    const imageUrl = res.secure_url;
                    technicalImageHosted = imageUrl;
                } catch (err) {
                    console.log(technicalImage, "4 image upload to cloudinary error", err)
                }
            }

            const hostedImages = technicalImageHosted ? [mainImageHosted, technicalImageHosted] : mainImageHosted ? [mainImageHosted] : undefined;

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
                "thumbnail": mainImageHosted,
                "images": hostedImages,
                "sales_channels": [
                    {
                        "id": "sc_01HWQMDWNYXNPFBYW355Z2XNXQ"
                    }
                ]
            }
            const res = await fetch("http://localhost:9000/admin/products/", {
                "headers": {
                    "content-type": "application/json",
                    "cookie": cookie,
                },
                "body": JSON.stringify(body),
                "method": "POST"
            });
            const data = await res.json();
            if (!data?.product) {
                console.log("data", data)
            }
            const productID = data?.product?.id;
            prevProductID = productID;
            const optionsID = data?.product?.options?.[0]?.id;
            prevProductOptionID = optionsID;

            //update metadata
            const productMetadata = {
                "attributes": JSON.stringify(getMetadata(jsonArray[i]))
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
                    "cookie": cookie,
                },
                "body": JSON.stringify(productMetadataBody),
                "method": "POST"
            });

        }

        prevProductCode = jsonArray[i]?.["Product Code"];
    }
}
abc();