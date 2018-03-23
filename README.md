# swagger_v2-client-component

### Description
Swagger v2 client component for the elastic.io platform.

#### Brief

It takes swagger spec file `=>` generates a list of all endpoints `=>` and shows you it inside dropdown list `=> ` you choose endpoint you want to access `=>` and see generated input controls fot every input parameter of endpoint. You fill all required fields and call endpoint with request params you passed. This is brief explanation of how component works.

#### Long

At first, when you want to use `Swagger v2 client` component, you need to create new credential with:
 - Swagger file URI
 - API URI

When you create it, you will be redirected to the `Configure input` section, because there is only one action called `Access endpoint` and it will be selected automatically. In `Configure input` section you will see single control: `dropdown list` (`select list`). You need click at it and wait while options are loaded. When options will be loaded, you will see every option as title of some endpoint with this pattern: `$HTTP_METHOD $ENDPOINT_TAG_NAME $URL`.
