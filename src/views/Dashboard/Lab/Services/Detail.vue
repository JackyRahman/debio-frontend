<style lang="scss" scoped>
.on-hover {
  cursor: pointer;
}
.image-placeholder{
  cursor: pointer;
  border: 1px solid lightgrey;
}
</style>

<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="12" xl="8" lg="8" md="8" order-md="1" order="2">
            <v-card class="dg-card" elevation="0" outlined>
              <v-form ref="addServiceForm">
                <v-card-text class="px-8 pb-8 pt-10">              
                  <div class="mt-5 mb-12 justify-space-evenly" align="center">
                      <v-avatar
                        size="125"
                        @click="selectPicture"
                        rounded
                        class="image-placeholder"
                      >
                        <v-img v-if="!imageUrl" src="@/assets/add-image-placeholder.png" alt="image"></v-img>
                        <v-img v-else :src="imageUrl" alt="image"></v-img>
                        <v-file-input 
                          style="display: none"
                          hide-input
                          prepend-icon="mdi-camera"
                          accept="image/*" 
                          ref="fileInput"
                          @change="imageUploadEventListener" />
                      </v-avatar>

                  </div>
                    <v-select
                    dense
                    label="Service Category"
                    placeholder="Service Category"
                    v-model="category"
                    outlined
                    :items="listCategories"
                    item-text="service_categories"
                    item-value="service_categories"
                    :rules="fieldRequiredRule"
                    ></v-select>

                    <v-select
                    dense
                    label="Type of Biological Sample"
                    placeholder="Type of Biological Sample"
                    v-model="biologicalType"
                    outlined
                    :items="listBiologicalType"
                    item-text="dnaCollectionProcess"
                    item-value="dnaCollectionProcess"
                    :rules="fieldRequiredRule"
                    ></v-select>

                    <v-text-field
                      dense
                      label="Service Name"
                      placeholder="Service Name"
                      outlined
                      v-model="name"
                      :rules="[...fieldRequiredRule, ...serviceNameRules, ...fieldEnglishRules]"
                    ></v-text-field>

                    <div class="d-flex">
                      <v-row>
                        <v-col>
                          <v-select
                          label="Currency"
                          outlined
                          dense
                          max="30"
                          v-model="currencyType"
                          :items="currencyList"
                          :rules="fieldRequiredRule"
                          ></v-select>
                        </v-col>
                        <v-col>
                          <v-text-field
                            dense
                            label="Price"
                            placeholder="Price"
                            outlined
                            type="number"
                            min="0"
                            step=".001"
                            v-model.number="price"
                            :rules="[...fieldRequiredRule, ...decimalRule]"
                          ></v-text-field>
                        </v-col>
                        <v-col>
                          <v-select
                          :disabled="isBiomedical"
                          label="QC Currency"
                          outlined
                          dense
                          v-model="currencyType"
                          :items="currencyList"
                          :rules="fieldRequiredRule"
                          ></v-select>
                        </v-col>
                        <v-col>
                          <v-text-field
                            :disabled="isBiomedical"
                            dense
                            label="QC Price"
                            placeholder="QC Price"
                            outlined
                            type="number"
                            min="0"
                            step=".001"
                            v-model.number="qcPrice"
                            :rules="[...fieldRequiredRule, ...decimalRule]"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </div>

                    <v-text-field
                      dense
                      label="Short Description"
                      placeholder="Short Description"
                      outlined
                      v-model="description"
                      :rules="[...fieldRequiredRule, ...descriptionRules, ...fieldEnglishRules]"
                    ></v-text-field>
                    
                    <v-row >
                      <v-col cols="8">
                        <v-text-field
                          dense
                          label="Expected Duration"
                          placeholder="Expected Duration"
                          max="30"
                          outlined
                          v-model="expectedDuration"
                          :rules="fieldRequiredRule"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="4">
                        <v-select
                          outlined
                          dense
                          v-model="selectExpectedDuration"
                          :items="listExpectedDuration"
                          :rules="fieldRequiredRule"
                        ></v-select>
                      </v-col>
                    </v-row>


                    <v-textarea
                      label="Long Description"
                      placeholder="Long Description"
                      outlined
                      v-model="longDescription"
                      :rules="[...fieldRequiredRule, ...longDescriptionRules, ...fieldEnglishRules]"
                    ></v-textarea>

                    <v-file-input
                      :rules="[...fieldRequiredRule, ...fileInputRules]"
                      accept=".pdf"
                      dense
                      label="Test Result Sample"
                      placeholder="Test Result Sample"
                      prepend-icon="mdi-file-document"
                      outlined
                      v-model="testResultSampleFile"
                      @change="fileUploadEventListener"
                    ></v-file-input>

                    <v-btn
                      color="primary"
                      block
                      large
                      :disabled="isUploading"
                      :loading="isLoading"
                      @click="updateService"
                    >Submit</v-btn>
                </v-card-text>
              </v-form>
            </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { upload } from "@/lib/ipfs"
import { getCategories } from "@/lib/api"
import { queryServicesById } from "@/lib/polkadotProvider/query/services";
import { fromEther } from "@/lib/balance-format"
import { updateService } from '@/lib/polkadotProvider/command/services'

const englishAlphabet = val => (val && /^[A-Za-z0-9!@#$%^&*\\(\\)\-_=+:;"',.\\/? ]+$/.test(val)) || "This field can only contain English alphabet"

export default {
  name: 'EditLabServices',

  data: () => ({
    name: "",
    category: "",
    price: "",
    qcPrice: "",
    description: "",
    longDescription: "",
    imageUrl: "",
    testResultSampleUrl: "",
    files: [],
    testResultSampleFile:[],
    sampleFiles:[],
    isLoading: false,
    isUploading: false,
    currencyList: ['DAI', 'Ethereum'],
    currencyType: "",
    listExpectedDuration: ['WorkingDays', 'Hours', 'Days'],
    listCategories: [],
    selectExpectedDuration: "",
    expectedDuration: "",
    biologicalType: "",
    listBiologicalType: [
      "Blood Cells - Dried Blood Spot Collection Process",
      "Epithelial Cells - Buccal Swab Collection Process",
      "Fecal Matters - Stool Collection Process",
      "Saliva - Saliva Collection Process",
      "Urine - Clean Catch Urine Collection Process",
    ],
    isBiomedical: false
  }),

  async mounted(){
    await this.getServiceCategory()
    const item = await this.getService(this.$route.params.id)
    this.id = item.id
    this.name = item.info.name
    this.price = Number(await fromEther(item.info.pricesByCurrency[0].priceComponents[0].value.replaceAll(",", "")))
    this.qcPrice = Number(await fromEther(item.info.pricesByCurrency[0].additionalPrices[0].value.replaceAll(",", "")))
    this.currencyType = item.info.pricesByCurrency[0].currency.toUpperCase()
    this.description = item.info.description
    this.longDescription = item.info.longDescription
    this.imageUrl = item.info.image
    this.testResultSampleUrl = item.info.testResultSample
    this.expectedDuration = item.info.expectedDuration.duration
    this.selectExpectedDuration = item.info.expectedDuration.durationType
    this.category = item.info.category
    this.biologicalType = item.info.dnaCollectionProcess
    
    if(this.imageUrl){
      fetch(this.imageUrl)
        .then(res => res.blob()) // Gets the response and returns it as a blob
        .then(blob => {
          this.files.push(new File([blob], this.imageUrl.substring(21)))
      });
    }
    
    if(this.testResultSampleUrl){
      fetch(this.testResultSampleUrl)
        .then(res => res.blob()) // Gets the response and returns it as a blob
        .then(blob => {
          const fileName = this.testResultSampleUrl.split("/").pop()
          this.testResultSampleFile = new File([blob], fileName, { type: "application/pdf" })
      });
    }
  },

  computed: {
    ...mapState({
      web3: (state) => state.metamask.web3
    }),

    ...mapGetters({
      api: 'substrate/getAPI',
      pair: 'substrate/wallet',
    }),

    fieldRequiredRule() {
      return [
        val => !!val || 'This field is required'
      ]
    },

    fieldEnglishRules() {
      return [ englishAlphabet ]
    },

    serviceNameRules() {
      return [
        val => (val && val.length <= 50) || 'This field only allows 50 characters.'
      ]
    },

    decimalRule() {
      return [
        val => /^\d*(\.\d{0,3})?$/.test(val) || this.isBiomedical || 'This field only allows 3 decimal characters.'
      ]
    },

    descriptionRules() {
      return [
        val => (val && val.length <= 100) || 'This field only allows 100 characters.'
      ]
    },

    longDescriptionRules() {
      return [
        val => (val && val.length <= 255) || 'This field only allows 255 characters.',
      ]
    },

    fileInputRules() {
      return [
        value => !Array.isArray(value) || 'This field is required',
        value => (!Array.isArray(value) && value?.size < 2000000) || 'The total file size uploaded exceeds the maximum file size allowed (2MB)',
        value => (!Array.isArray(value) && value?.type === "application/pdf") || 'The files uploaded are not in the supported file formats.'
      ]
    },

  },

  methods: {
    async getService(id) {
      const detailService = await queryServicesById(
        this.api,
        id
      )
      return detailService
    },

    async getServiceCategory() {
      const { data : data } = await getCategories()
      this.listCategories =  data
    },

    async updateService() {
      if(this.isLoading) return // If function already running return.
      if (!this.$refs.addServiceForm.validate()) {
        return
      }
      this.isLoading = true
      await updateService(
        this.api,
        this.pair,
        this.id,
        {
          name: this.name,
          pricesByCurrency: [
            {
              currency: this.currencyType,
              priceComponents: [
                {
                  component: "testing_price",
                  value: this.web3.utils.toWei(String(this.price), 'ether')
                }
              ],
              additionalPrices: [
                {
                  component: "qc_price",
                  value: this.web3.utils.toWei(String(this.qcPrice), 'ether')
                }
              ],
            },
          ],
          expectedDuration: { 
            duration: this.expectedDuration, 
            durationType: this.selectExpectedDuration
          },
          category: this.category,
          description: this.description,
          testResultSample: this.testResultSampleUrl,
          longDescription: this.longDescription,
          image: this.imageUrl,
          dnaCollectionProcess: this.biologicalType,
        },
        () => {
          this.$router.push('/lab/services')
          this.isLoading = false
        }
      )
    },

    imageUploadEventListener(file) {
      this.isUploading = true
      this.isLoading = true
      this.imageUrl = ""
      if (file) {
        if (file.name.lastIndexOf('.') <= 0) {
          return
        }
        const fr = new FileReader()
        fr.readAsArrayBuffer(file)

        const context = this
        fr.addEventListener('load', async () => {
          // Upload
          const uploaded = await upload({
            fileChunk: fr.result,
            fileType: file.type,
            fileName: file.name,
          })
          const computeLink = `${uploaded.ipfsPath[0].data.ipfsFilePath}/${uploaded.fileName}`

          context.imageUrl = `https://ipfs.io/ipfs/${computeLink}` // this is an image file that can be sent to server... (convert img to file path)
          context.isUploading = false
          context.isLoading = false
        })
      }
    },

    fileUploadEventListener(file) {
      if (!file || file.size >= 2000000) {
        return
      }
      this.isUploading = true
      this.isLoading = true
      this.testResultSampleUrl = ""
      if (file) {
        if (file.name.lastIndexOf('.') <= 0) {
          return
        }
        const fr = new FileReader()
        fr.readAsArrayBuffer(file)

        const context = this
        fr.addEventListener('load', async () => {
          // Upload
          const uploaded = await upload({
            fileChunk: fr.result,
            fileType: file.type,
            fileName: file.name,
          })
          const computeLink = `${uploaded.ipfsPath[0].data.ipfsFilePath}/${uploaded.fileName}`

          context.testResultSampleUrl = `https://ipfs.io/ipfs/${computeLink}` // this is an image file that can be sent to server... (convert img to file path)
          context.isUploading = false
          context.isLoading = false
        })
      }
    },

    selectPicture() {
      this.$refs.fileInput.$refs.input.click()
    },

  },

  watch: {
    category() {
      if (this.category == 'Covid-19') {
        this.isBiomedical = true
        this.qcPrice = "0"
      } else {
        this.isBiomedical = false
      }
    },
  }
}
</script>