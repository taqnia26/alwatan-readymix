import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq } from "drizzle-orm";
import {
  CreateBlogPostBody,
  CreateBlogPostResponse,
  CreateProductBody,
  CreateProductResponse,
  CreateQuoteBody,
  CreateQuoteResponse,
  DeleteProductParams,
  GetAdminSummaryResponse,
  GetBlogPostParams,
  GetBlogPostResponse,
  GetHomeResponse,
  GetPageContentParams,
  GetPageContentResponse,
  GetProductParams,
  GetProductResponse,
  GetPublicSettingsResponse,
  ListBlogPostsResponse,
  ListBranchesResponse,
  ListCertificatesResponse,
  ListPageContentResponse,
  ListProductsResponse,
  ListQuotesResponse,
  UpdatePageContentBody,
  UpdatePageContentParams,
  UpdatePageContentResponse,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
  UpdateQuoteStatusBody,
  UpdateQuoteStatusParams,
  UpdateQuoteStatusResponse,
} from "@workspace/api-zod";
import {
  blogPostsTable,
  branchesTable,
  certificatesTable,
  db,
  pageContentTable,
  productsTable,
  quoteRequestsTable,
  siteSettingsTable,
} from "@workspace/db";

const router: IRouter = Router();

const imageFallbacks = {
  product: "/construction-1.png",
  certificate: "/certificate-1.png",
  blog: "/construction-2.png",
};

function iso(value: Date | null): string {
  return (value ?? new Date()).toISOString();
}

function mapProduct(product: typeof productsTable.$inferSelect) {
  return {
    id: product.id,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    slug: product.slug,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    specsAr: product.specsAr,
    specsEn: product.specsEn,
    imageUrl: product.imageUrl || imageFallbacks.product,
    compressiveStrength: product.compressiveStrength,
  };
}

function mapBranch(branch: typeof branchesTable.$inferSelect) {
  return {
    id: branch.id,
    nameAr: branch.nameAr,
    nameEn: branch.nameEn,
    addressAr: branch.addressAr,
    addressEn: branch.addressEn,
    city: branch.city,
    lat: branch.lat,
    lng: branch.lng,
    phone: branch.phone,
    workingHours: branch.workingHours,
    orderIndex: branch.orderIndex,
  };
}

function mapCertificate(certificate: typeof certificatesTable.$inferSelect) {
  return {
    id: certificate.id,
    titleAr: certificate.titleAr,
    titleEn: certificate.titleEn,
    descriptionAr: certificate.descriptionAr,
    descriptionEn: certificate.descriptionEn,
    imageUrl: certificate.imageUrl || imageFallbacks.certificate,
    issuedBy: certificate.issuedBy,
    issuedDate: certificate.issuedDate,
  };
}

function mapPost(post: typeof blogPostsTable.$inferSelect) {
  return {
    id: post.id,
    titleAr: post.titleAr,
    titleEn: post.titleEn,
    excerptAr: post.excerptAr,
    excerptEn: post.excerptEn,
    contentAr: post.contentAr,
    contentEn: post.contentEn,
    slug: post.slug,
    coverImage: post.coverImage || imageFallbacks.blog,
    status: post.status,
    publishedAt: iso(post.publishedAt),
  };
}

function mapContent(content: typeof pageContentTable.$inferSelect) {
  return {
    id: content.id,
    pageSlug: content.pageSlug,
    sectionKey: content.sectionKey,
    fieldKey: content.fieldKey,
    valueAr: content.valueAr,
    valueEn: content.valueEn,
    contentType: content.contentType,
    updatedAt: iso(content.updatedAt),
  };
}

async function getPublicSettings() {
  const rows = await db.select().from(siteSettingsTable);
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    whatsapp: settings.whatsapp ?? "",
    quoteEmail: settings.quoteEmail ?? "",
    phone: settings.phone ?? "",
    email: settings.email ?? "",
    instagramUrl: settings.instagramUrl ?? "",
    linkedinUrl: settings.linkedinUrl ?? "",
  };
}

router.get("/public/home", async (_req, res): Promise<void> => {
  const [products, branches, certificates, blogPosts, content, settings] =
    await Promise.all([
      db.select().from(productsTable).orderBy(asc(productsTable.id)),
      db.select().from(branchesTable).orderBy(asc(branchesTable.orderIndex)),
      db.select().from(certificatesTable).orderBy(asc(certificatesTable.id)),
      db
        .select()
        .from(blogPostsTable)
        .where(eq(blogPostsTable.status, "published"))
        .orderBy(desc(blogPostsTable.publishedAt)),
      db
        .select()
        .from(pageContentTable)
        .where(eq(pageContentTable.pageSlug, "home"))
        .orderBy(asc(pageContentTable.id)),
      getPublicSettings(),
    ]);

  res.json(
    GetHomeResponse.parse({
      products: products.map(mapProduct),
      branches: branches.map(mapBranch),
      certificates: certificates.map(mapCertificate),
      blogPosts: blogPosts.map(mapPost),
      content: content.map(mapContent),
      settings,
    }),
  );
});

router.get("/public/content/:pageSlug", async (req, res): Promise<void> => {
  const params = GetPageContentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const content = await db
    .select()
    .from(pageContentTable)
    .where(eq(pageContentTable.pageSlug, params.data.pageSlug))
    .orderBy(asc(pageContentTable.id));

  res.json(GetPageContentResponse.parse(content.map(mapContent)));
});

router.get("/products", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(asc(productsTable.id));
  res.json(ListProductsResponse.parse(products.map(mapProduct)));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.insert(productsTable).values(parsed.data).returning();
  res.status(201).json(CreateProductResponse.parse(mapProduct(product)));
});

router.get("/products/:slug", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.slug, params.data.slug));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(mapProduct(product)));
});

router.patch("/products/:slug", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid product update" });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set(parsed.data)
    .where(eq(productsTable.slug, params.data.slug))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse(mapProduct(product)));
});

router.delete("/products/:slug", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.slug, params.data.slug))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/branches", async (_req, res): Promise<void> => {
  const branches = await db.select().from(branchesTable).orderBy(asc(branchesTable.orderIndex));
  res.json(ListBranchesResponse.parse(branches.map(mapBranch)));
});

router.get("/certificates", async (_req, res): Promise<void> => {
  const certificates = await db
    .select()
    .from(certificatesTable)
    .orderBy(asc(certificatesTable.id));
  res.json(ListCertificatesResponse.parse(certificates.map(mapCertificate)));
});

router.get("/blog", async (_req, res): Promise<void> => {
  const posts = await db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.status, "published"))
    .orderBy(desc(blogPostsTable.publishedAt));
  res.json(ListBlogPostsResponse.parse(posts.map(mapPost)));
});

router.post("/blog", async (req, res): Promise<void> => {
  const parsed = CreateBlogPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [post] = await db
    .insert(blogPostsTable)
    .values({
      ...parsed.data,
      publishedAt: parsed.data.status === "published" ? new Date() : null,
    })
    .returning();
  res.status(201).json(CreateBlogPostResponse.parse(mapPost(post)));
});

router.get("/blog/:slug", async (req, res): Promise<void> => {
  const params = GetBlogPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db
    .select()
    .from(blogPostsTable)
    .where(
      and(
        eq(blogPostsTable.slug, params.data.slug),
        eq(blogPostsTable.status, "published"),
      ),
    );

  if (!post) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }

  res.json(GetBlogPostResponse.parse(mapPost(post)));
});

router.post("/quotes", async (req, res): Promise<void> => {
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.website) {
    res.status(400).json({ error: "Invalid quote request" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.productId));

  if (!product) {
    res.status(400).json({ error: "Please select a valid product" });
    return;
  }

  const [quote] = await db
    .insert(quoteRequestsTable)
    .values({
      productId: parsed.data.productId,
      quantityEstimate: parsed.data.quantityEstimate,
      projectLocation: parsed.data.projectLocation,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      notes: parsed.data.notes ?? "",
    })
    .returning();

  req.log.info({ quoteId: quote.id }, "Quote request received");
  res.status(201).json(
    CreateQuoteResponse.parse({
      id: quote.id,
      productId: quote.productId,
      productName: product.nameAr,
      quantityEstimate: quote.quantityEstimate,
      projectLocation: quote.projectLocation,
      fullName: quote.fullName,
      phone: quote.phone,
      email: quote.email,
      notes: quote.notes,
      status: quote.status,
      createdAt: iso(quote.createdAt),
    }),
  );
});

router.get("/admin/summary", async (_req, res): Promise<void> => {
  const [quoteCount, newQuoteCount, productCount, branchCount, publishedCount, recent] =
    await Promise.all([
      db.select({ value: count() }).from(quoteRequestsTable),
      db
        .select({ value: count() })
        .from(quoteRequestsTable)
        .where(eq(quoteRequestsTable.status, "new")),
      db.select({ value: count() }).from(productsTable),
      db.select({ value: count() }).from(branchesTable),
      db
        .select({ value: count() })
        .from(blogPostsTable)
        .where(eq(blogPostsTable.status, "published")),
      db.select().from(quoteRequestsTable).orderBy(desc(quoteRequestsTable.createdAt)).limit(5),
    ]);

  const productRows = await db.select().from(productsTable);
  const productNames = new Map(productRows.map((product) => [product.id, product.nameAr]));

  res.json(
    GetAdminSummaryResponse.parse({
      newQuotes: Number(newQuoteCount[0]?.value ?? 0),
      totalQuotes: Number(quoteCount[0]?.value ?? 0),
      publishedPosts: Number(publishedCount[0]?.value ?? 0),
      products: Number(productCount[0]?.value ?? 0),
      branches: Number(branchCount[0]?.value ?? 0),
      recentQuotes: recent.map((quote) => ({
        id: quote.id,
        productId: quote.productId,
        productName: productNames.get(quote.productId) ?? "",
        quantityEstimate: quote.quantityEstimate,
        projectLocation: quote.projectLocation,
        fullName: quote.fullName,
        phone: quote.phone,
        email: quote.email,
        notes: quote.notes,
        status: quote.status,
        createdAt: iso(quote.createdAt),
      })),
    }),
  );
});

router.get("/admin/quotes", async (_req, res): Promise<void> => {
  const [quotes, products] = await Promise.all([
    db.select().from(quoteRequestsTable).orderBy(desc(quoteRequestsTable.createdAt)),
    db.select().from(productsTable),
  ]);
  const productNames = new Map(products.map((product) => [product.id, product.nameAr]));

  res.json(
    ListQuotesResponse.parse(
      quotes.map((quote) => ({
        id: quote.id,
        productId: quote.productId,
        productName: productNames.get(quote.productId) ?? "",
        quantityEstimate: quote.quantityEstimate,
        projectLocation: quote.projectLocation,
        fullName: quote.fullName,
        phone: quote.phone,
        email: quote.email,
        notes: quote.notes,
        status: quote.status,
        createdAt: iso(quote.createdAt),
      })),
    ),
  );
});

router.patch("/admin/quotes/:id", async (req, res): Promise<void> => {
  const params = UpdateQuoteStatusParams.safeParse(req.params);
  const parsed = UpdateQuoteStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid quote status update" });
    return;
  }

  const [quote] = await db
    .update(quoteRequestsTable)
    .set({ status: parsed.data.status })
    .where(eq(quoteRequestsTable.id, params.data.id))
    .returning();

  if (!quote) {
    res.status(404).json({ error: "Quote request not found" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, quote.productId));

  res.json(
    UpdateQuoteStatusResponse.parse({
      id: quote.id,
      productId: quote.productId,
      productName: product?.nameAr ?? "",
      quantityEstimate: quote.quantityEstimate,
      projectLocation: quote.projectLocation,
      fullName: quote.fullName,
      phone: quote.phone,
      email: quote.email,
      notes: quote.notes,
      status: quote.status,
      createdAt: iso(quote.createdAt),
    }),
  );
});

router.get("/admin/content", async (_req, res): Promise<void> => {
  const content = await db.select().from(pageContentTable).orderBy(asc(pageContentTable.id));
  res.json(ListPageContentResponse.parse(content.map(mapContent)));
});

router.patch("/admin/content/:id", async (req, res): Promise<void> => {
  const params = UpdatePageContentParams.safeParse(req.params);
  const parsed = UpdatePageContentBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid content update" });
    return;
  }

  const [content] = await db
    .update(pageContentTable)
    .set(parsed.data)
    .where(eq(pageContentTable.id, params.data.id))
    .returning();

  if (!content) {
    res.status(404).json({ error: "Content field not found" });
    return;
  }

  res.json(UpdatePageContentResponse.parse(mapContent(content)));
});

router.get("/settings/public", async (_req, res): Promise<void> => {
  res.json(GetPublicSettingsResponse.parse(await getPublicSettings()));
});

export default router;