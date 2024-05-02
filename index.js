const csv = require('csvtojson');
const { convert } = require('html-to-text');
const cloudinary = require('cloudinary');

cloudinary.v2.config({
    cloud_name: 'disfbqrv5',
    api_key: '159248614235452',
    api_secret: 'PxpElsNYhH0jm2OrW_3qc1SJcEw',
    secure: true,
});
// [
//     "accessible_basins",
//     "artize_accessories",
//     "artize_basins",
//     "artize_flush_plates",
//     "artize_manual_valves",
//     "artize_pneumatic_concealed__cisterns_&_frames",
//     "artize_shower_heads",
//     "artize_taps",
//     "artize_thermostatic_concealed_shower_valves",
//     "artize_wc's",
//     "artize_wellness",
//     "basin_wastes_&_bottle_traps",
//     "bathscreens",
//     "body_jets",
//     "douches_&_outlets",
//     "handsets_&_shower_hoses",
//     "jaquar_accessories",
//     "jaquar_basins",
//     "jaquar_concealed_cistern_&__frames",
//     "jaquar_flush_plates",
//     "jaquar_manual_valves",
//     "jaquar_shower_heads",
//     "jaquar_taps",
//     "jaquar_thermostatic_concealed_shower_valves",
//     "jaquar_wc's",
//     "jaquar_wellness",
//     "quadrant_doors",
//     "shower_arms",
//     "shower_outlets",
//     "slide_rails_&_multifunctional_shower_systems",
//     "sliding_doors",
//     "smart_wc's",
//     "tankless_wc's",
//     "walk_in_panels"
// ]

const collection_name = "accessible_basins";
const collection_id = "pcol_01HWWH2BR7W8P1MNDBYZHH34PT";

const cookie = "__stripe_mid=69b45612-ba0a-415b-8556-c3a51872a18d344a63; ajs_user_id=usr_01HWQMHRKQPTTR8P91WMFTM36N; ajs_anonymous_id=fc19007d-93cc-48a2-b811-43c2802f1925; connect.sid=s%3AsWmcABZ0vpWySCsnbWRC6gdFulFAfgbv.qGVcGs5Jw4xmZA2RDKaH0uyBiJetvht2%2BailJm6VZEs";





const cloudinaryFolder = `../../jaquaruk-e6611f194465/jaquaruk-e6611f194465/${collection_name}`;
const csvFilePath = `../../jaquaruk-e6611f194465/jaquaruk-e6611f194465/${collection_name}/productData.csv`;


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

const getAttributesMetadata = (obj) => {
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
                "sku": jsonArray[i]?.["Product Code"],
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

            const productImageURLs = productData?.product?.images?.map((img) => img.url);

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
                    "manage_inventory": true,
                    "sku": jsonArray[i]?.["Product Code"]
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
                        "id": "sc_01HWWEKWMMG5BNQXT0MQ0KMQ6B"
                    }
                ],
                "collection_id": collection_id
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

            const PDF2D = jsonArray[i]?.["Product 2d Pdf"];
            let FilesMetadata;
            if (PDF2D) {
                try {
                    const res = await cloudinary.v2.uploader
                        .upload(`${cloudinaryFolder}/${PDF2D}`, {
                            folder: "PDF",
                            use_filename: true,
                            unique_filename: false,
                        });
                    const PdfUrl = res.secure_url;

                    FilesMetadata = [
                        {
                            key: "product_2d_pdf",
                            value: PdfUrl
                        }
                    ]

                } catch (err) {
                    console.log(mainImage, "PDF2D upload to cloudinary error", err)
                }
            }

            //update metadata
            const productMetadata = {
                "attributes": JSON.stringify(getAttributesMetadata(jsonArray[i])),
                "files": FilesMetadata ? JSON.stringify(FilesMetadata) : undefined
            };

            const productMetadataBody = {
                "title": productTitle,
                "handle": productHandle,
                "material": null,
                "subtitle": null,
                "description": productDescription,
                "type": null,
                "collection_id": collection_id,
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