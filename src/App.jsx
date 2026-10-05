import { useCallback, useEffect, useState } from 'react'
import {
  clearTokens,
  createProduct,
  deleteProduct,
  fetchProducts,
  getTokens,
  login,
  logout,
  saveTokens,
  updateProduct,
} from './api'
import './App.css'

const emptyProduct = {
  product_name: '',
  description: '',
  price: '',
  quantity: '',
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mark6_user') || 'https://paglinawanmark-act-6.onrender.com/api')
    } catch {
      return null
    }
  })
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyProduct)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetchProducts()
      setProducts(response.data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (getTokens().accessToken) {
      loadProducts()
    }
  }, [loadProducts])

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await login(identity, password)
      saveTokens(response.tokens)
      setUser(response.user)
      localStorage.setItem('mark6_user', JSON.stringify(response.user))
      setPassword('')
      setNotice('Welcome back.')
      await loadProducts()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function beginEdit(product) {
    setEditingId(product.id)
    setShowForm(true)
    setForm({
      product_name: product.product_name,
      description: product.description || '',
      price: product.price,
      quantity: product.quantity,
    })
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setShowForm(false)
    setForm(emptyProduct)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const product = {
      ...form,
      price: String(form.price),
      quantity: Number(form.quantity),
    }

    try {
      if (editingId) {
        await updateProduct(editingId, product)
        setNotice('Product updated.')
      } else {
        await createProduct(product)
        setNotice('Product added.')
      }
      cancelEdit()
      await loadProducts()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.product_name}"? This cannot be undone.`)) {
      return
    }

    setError('')
    setNotice('')
    try {
      await deleteProduct(product.id)
      setNotice('Product deleted.')
      if (editingId === product.id) {
        cancelEdit()
      }
      await loadProducts()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleLogout() {
    setError('')
    try {
      await logout()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      clearTokens()
      localStorage.removeItem('mark6_user')
      setUser(null)
      setProducts([])
      cancelEdit()
    }
  }

  if (!user) {
    return (
      <main className="login-shell">
        <header className="shell login-header">
          <a className="brand" href="/" aria-label="Product Desk">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span className="brand-name">Product Desk</span>
          </a>
        </header>
        <section className="login-main">
          <div className="login-content">
            <p className="eyebrow">Private workspace</p>
            <h1 className="login-title">Welcome back.</h1>
            <p className="login-intro">Sign in to continue to your collection.</p>
            {error && <div className="notice notice-error" role="alert">{error}</div>}
            <form className="login-form" onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="identity">Username or email</label>
                <input
                  id="identity"
                  autoComplete="username"
                  value={identity}
                  onChange={(event) => setIdentity(event.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <button className="button button-primary" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </section>
        <footer className="login-footer">Product Desk · Private access</footer>
      </main>
    )
  }

  return (
    <>
      <header className="site-header">
        <nav className="shell site-nav" aria-label="Main navigation">
          <a className="brand" href="/" aria-label="Product Desk">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span className="brand-name">Product Desk</span>
          </a>
          <div className="nav-account">
            <span>{user.username}</span>
            <button className="button button-secondary button-small" onClick={handleLogout}>Sign out</button>
          </div>
        </nav>
      </header>

      <main className="shell page-main">
        {showForm ? (
          <section className="form-shell">
            <p className="breadcrumb">
              <button className="link-button" onClick={cancelEdit}>Product catalog</button>
              <span aria-hidden="true"> / </span>
              {editingId ? 'Edit product' : 'Add product'}
            </p>
            <div className="form-heading">
              <p className="eyebrow">{editingId ? 'Update inventory' : 'New inventory'}</p>
              <h1>{editingId ? 'Edit product' : 'Add a product'}</h1>
            </div>
            {error && <div className="notice notice-error" role="alert">{error}</div>}
            <form className="product-form" onSubmit={handleSubmit}>
            <label>
              <span>Product name</span>
              <input
                name="product_name"
                maxLength="100"
                value={form.product_name}
                onChange={updateField}
                placeholder="e.g. Canvas tote bag"
                required
              />
            </label>
            <label>
              <span>Description <span className="optional">Optional</span></span>
              <textarea
                name="description"
                rows="4"
                value={form.description}
                onChange={updateField}
                placeholder="Add a short product description"
              />
            </label>
            <div className="form-grid">
              <label>
                <span>Price</span>
                <div className="input-prefix">
                  <span>₱</span>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    max="99999999.99"
                    step="0.01"
                    value={form.price}
                    onChange={updateField}
                    placeholder="0.00"
                    required
                  />
                </div>
              </label>
              <label>
                <span>Quantity</span>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={updateField}
                  placeholder="0"
                  required
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="button button-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
              </button>
              <button type="button" className="button button-secondary" onClick={cancelEdit}>Cancel</button>
            </div>
            </form>
          </section>
        ) : (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">Inventory</p>
                <h1>Product catalog</h1>
                <p className="page-subtitle">A clear view of your collection.</p>
              </div>
              <button
                className="button button-primary"
                onClick={() => { setShowForm(true); setError(''); setNotice('') }}
              >
                Add product
              </button>
            </div>
            {error && <div className="notice notice-error" role="alert">{error}</div>}
            {notice && <div className="notice" role="status">{notice}</div>}
            <div className="catalog-toolbar">
              <span>{products.length} {products.length === 1 ? 'product' : 'products'}</span>
              <button className="link-button" onClick={loadProducts} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          {loading && products.length === 0 ? (
            <div className="empty-state"><p>Loading products…</p></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <h2>Your catalog is ready.</h2>
              <p>Add your first product to begin.</p>
              <button
                className="button button-primary"
                onClick={() => { setShowForm(true); setError(''); setNotice('') }}
              >
                Add first product
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="product-id" data-label="ID">{product.id}</td>
                      <td className="product-name" data-label="Product">{product.product_name}</td>
                      <td className="product-description" data-label="Description">{product.description || '—'}</td>
                      <td className="product-price" data-label="Price">₱{Number(product.price).toFixed(2)}</td>
                      <td data-label="Quantity">{product.quantity}</td>
                      <td data-label="Created">{product.created_at || '—'}</td>
                      <td className="product-actions" data-label="Actions">
                        <button className="button button-secondary button-small" onClick={() => beginEdit(product)}>Edit</button>
                        <button className="button button-danger button-small" onClick={() => handleDelete(product)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </>
        )}
        <footer className="page-footer">Product Desk · Private access</footer>
      </main>
    </>
  )
}

export default App
